package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const AIServiceURL = "http://localhost:8000/chat"

type AIRequest struct {
	Message   string `json:"message,omitempty"`
	AudioData string `json:"audio_data,omitempty"`
	SessionID string `json:"session_id"`
}

type AIResponse struct {
	Text      string `json:"text"`
	AudioData string `json:"audio_data,omitempty"`
	Emotion   string `json:"emotion,omitempty"`
}

// GetAIResponse sends the user message to the Python AI Service and returns the response
func GetAIResponse(message string, audioData string, sessionID string) (*AIResponse, error) {
	reqBody := AIRequest{
		Message:   message,
		AudioData: audioData,
		SessionID: sessionID,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %v", err)
	}

	client := &http.Client{
		Timeout: 30 * time.Second, // Increased timeout for audio processing
	}

	resp, err := client.Post(AIServiceURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error calling AI service: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI service returned non-200 status: %d", resp.StatusCode)
	}

	var aiResp AIResponse
	if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil {
		return nil, fmt.Errorf("error decoding response: %v", err)
	}

	return &aiResp, nil
}
