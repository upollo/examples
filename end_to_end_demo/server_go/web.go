package main

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"

	"github.com/thoas/go-funk"

	upollo "github.com/Userwatch/userwatch-go"
)

type Web struct {
	uwclient upollo.ShepherdClient
}

type RegisterRequest struct {
	Username           string `json:"username"`
	UpolloToken     string `json:"upolloToken"`
	ChallengeID        string `json:"challengeID,omitempty"`
	ChallengeSecret    string `json:"challengeSecret,omitempty"`
	ChallengeWebauthn  string `json:"challengeWebauthnResponse,omitempty"`
}

type RegisterResponse struct {
	DeviceID       string                      `json:"deviceID"`
	UserId         string                      `json:"userID,omitempty"`
	Challenge      bool                        `json:"challenge,omitempty"`
	AccountSharing bool                        `json:"accountSharing,omitempty"`
	ChallengeTypes []upollo.ChallengeType `json:"challengeTypes,omitempty"`
}

func (w *Web) HandleRegister(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rw.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == "OPTIONS" {
		rw.Header().Set("Access-Control-Allow-Methods", "POST")
		rw.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		rw.Header().Set("Access-Control-Max-Age", "3600")
		rw.WriteHeader(http.StatusNoContent)
		return
	}

	var request RegisterRequest
	json.NewDecoder(r.Body).Decode(&request)

	var challengeVerification *upollo.ChallengeVerificationRequest
	if request.ChallengeID != "" && request.ChallengeSecret != "" {
		challengeVerification = &upollo.ChallengeVerificationRequest{
			ChallengeID:    request.ChallengeID,
			SecretResponse: request.ChallengeSecret,
			Type:           upollo.ChallengeType_CHALLENGE_TYPE_SMS,
		}
	} else if request.ChallengeID != "" && request.ChallengeWebauthn != "" {
		challengeB64, err := base64.StdEncoding.DecodeString(request.ChallengeWebauthn)
		if err != nil {
			log.Printf("Unable to decode webauthn challenge as b64, %v", err)
		}
		if challengeB64 != nil {
			challengeVerification = &upollo.ChallengeVerificationRequest{
				ChallengeID:                request.ChallengeID,
				WebauthnCredentialResponse: challengeB64,
				Type:                       upollo.ChallengeType_CHALLENGE_TYPE_WEBAUTHN,
			}
		}
	}

	result, err := w.uwclient.Validate(ctx, &upollo.ValidationRequest{
		ValidationToken: request.UpolloToken,
		Userinfo: &upollo.UserInfo{
			UserID: request.Username,
		},
		ChallengeVerification: challengeVerification,
	})

	if err != nil {
		log.Printf("invalid response from validate %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
	} else {
		status := http.StatusOK
		isAccountSharing := funk.Contains(result.Flag, func(flag *upollo.Flag) bool {
			return flag.Type == upollo.FlagType_ACCOUNT_SHARING
		})
		response := RegisterResponse{
			DeviceID:       result.DeviceInfo.DeviceID,
			UserId:         result.UserInfo.UserID,
			AccountSharing: isAccountSharing,
			Challenge:      result.Action == upollo.Outcome_CHALLENGE,
			ChallengeTypes: result.SupportedChallenges,
		}

		if result.Action == upollo.Outcome_DENY {
			status = http.StatusForbidden
		} else if result.Action == upollo.Outcome_CHALLENGE && !isAccountSharing {
			status = http.StatusUnauthorized
		} else if result.Action == upollo.Outcome_CHALLENGE && isAccountSharing {
			status = http.StatusOK
		}

		rw.WriteHeader(status)
		rw.Header().Set("Content-Type", "application/json")
		json.NewEncoder(rw).Encode(response)
	}
}

func (w *Web) HandleDeviceList(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var request upollo.DeviceListRequest
	json.NewDecoder(r.Body).Decode(&request)

	response, err := w.uwclient.GetDeviceList(ctx, &request)
	if err != nil {
		log.Printf("invalid response from validate %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
	} else {

		rw.Header().Set("Content-Type", "application/json")
		json.NewEncoder(rw).Encode(response)
	}

}

type CreateChallengeRequest struct {
	Type        upollo.ChallengeType `json:"challengeType,omitempty"`
	PhoneNumber string                    `json:"phoneNumber"`
	DeviceID    string                    `json:"deviceID,omitempty"`
	Origin      string                    `json:"origin,omitempty"`
}

func (w *Web) HandleCreateChallenge(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var request CreateChallengeRequest
	json.NewDecoder(r.Body).Decode(&request)

	response, err := w.uwclient.CreateChallenge(ctx, &upollo.CreateChallengeRequest{
		Type:     request.Type,
		DeviceID: request.DeviceID,
		Origin:   request.Origin,
		Userinfo: &upollo.UserInfo{
			UserPhone: request.PhoneNumber,
		},
	})
	if err != nil {
		log.Printf("invalid response from CreateChallenge %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
	}
	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(response)
}
