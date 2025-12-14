package service

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// Message defines the structure of WebSocket messages
type Message struct {
	Type    string `json:"type"`    // "text", "audio", "system"
	Content string `json:"content"` // Text content or base64 audio
	Sender  string `json:"sender"`  // "user", "ai"
}

// Client represents a connected user
type Client struct {
	Hub  *Hub
	Conn *websocket.Conn
	Send chan []byte
}

// Hub maintains the set of active clients
type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mu         sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
			log.Println("New client connected")
		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Println("Client disconnected")
		case message := <-h.Broadcast:
			h.mu.Lock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// For now, if user sends text, we mock an AI response immediately
		var msg Message
		if err := json.Unmarshal(message, &msg); err == nil {
			if msg.Sender == "user" {
				// Process user message (Send to AI service logic would go here)
				log.Printf("Received from user type: %s", msg.Type)

				var aiResp *AIResponse
				var err error

				if msg.Type == "audio" {
					// Audio Message
					aiResp, err = GetAIResponse("", msg.Content, "default_session")
				} else {
					// Text Message
					aiResp, err = GetAIResponse(msg.Content, "", "default_session")
				}

				var response Message
				if err != nil {
					log.Printf("Error calling AI service: %v", err)
					response = Message{
						Type:    "system",
						Content: "AI 服务暂时不可用，请稍后再试。",
						Sender:  "ai",
					}
				} else {
					// If AI returns audio data, send it as audio type
					if aiResp.AudioData != "" {
						// Send text response first (optional, for UI update)
						textResponse := Message{
							Type:    "text",
							Content: aiResp.Text,
							Sender:  "ai",
						}
						textBytes, _ := json.Marshal(textResponse)
						c.Hub.Broadcast <- textBytes

						// Then send audio response
						response = Message{
							Type:    "audio",
							Content: aiResp.AudioData,
							Sender:  "ai",
						}
					} else {
						response = Message{
							Type:    "text",
							Content: aiResp.Text,
							Sender:  "ai",
						}
					}
				}

				respBytes, _ := json.Marshal(response)
				c.Hub.Broadcast <- respBytes
			}
		}
	}
}

func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		}
	}
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{Hub: hub, Conn: conn, Send: make(chan []byte, 256)}
	client.Hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}
