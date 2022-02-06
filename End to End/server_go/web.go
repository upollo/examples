package main

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"

	"github.com/thoas/go-funk"

	userwatchgo "github.com/Userwatch/userwatch-go"
)

type Web struct {
	uwclient userwatchgo.ShepherdClient
}

type RegisterRequest struct {
	Username           string `json:"username"`
	UserwatchSignature string `json:"userwatchSignature"`
	UserwatchToken     string `json:"userwatchToken"`
	ChallengeID        string `json:"challengeID,omitempty"`
	ChallengeSecret    string `json:"challengeSecret,omitempty"`
	ChallengeWebauthn  string `json:"challengeWebauthnResponse,omitempty"`
}

type RegisterResponse struct {
	DeviceID       string                      `json:"deviceID"`
	UserId         string                      `json:"userID,omitempty"`
	Challenge      bool                        `json:"challenge,omitempty"`
	AccountSharing bool                        `json:"accountSharing,omitempty"`
	ChallengeTypes []userwatchgo.ChallengeType `json:"challengeTypes,omitempty"`
}

func (w *Web) HandleRegister(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var request RegisterRequest
	json.NewDecoder(r.Body).Decode(&request)

	var challengeVerification *userwatchgo.ChallengeVerificationRequest
	if request.ChallengeID != "" && request.ChallengeSecret != "" {
		challengeVerification = &userwatchgo.ChallengeVerificationRequest{
			ChallengeID:    request.ChallengeID,
			SecretResponse: request.ChallengeSecret,
			Type:           userwatchgo.ChallengeType_CHALLENGE_TYPE_SMS,
		}
	} else if request.ChallengeID != "" && request.ChallengeWebauthn != "" {
		challengeB64, err := base64.StdEncoding.DecodeString(request.ChallengeWebauthn)
		if err != nil {
			log.Printf("Unable to decode webauthn challenge as b64, %v", err)
		}
		if challengeB64 != nil {
			challengeVerification = &userwatchgo.ChallengeVerificationRequest{
				ChallengeID:                request.ChallengeID,
				WebauthnCredentialResponse: challengeB64,
				Type:                       userwatchgo.ChallengeType_CHALLENGE_TYPE_WEBAUTHN,
			}
		}
	}

	result, err := w.uwclient.Validate(ctx, &userwatchgo.ValidationRequest{
		ValidationToken: request.UserwatchToken,
		Userinfo: &userwatchgo.UserInfo{
			UserID: request.Username,
		},
		ChallengeVerification: challengeVerification,
	})

	if err != nil {
		log.Printf("invalid response from validate %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
	} else {
		status := http.StatusOK
		isAccountSharing := funk.Contains(result.Flag, func(flag *userwatchgo.Flag) bool {
			return flag.Type == userwatchgo.FlagType_ACCOUNT_SHARING
		})
		response := RegisterResponse{
			DeviceID:       result.DeviceInfo.DeviceID,
			UserId:         result.UserInfo.UserID,
			AccountSharing: isAccountSharing,
			Challenge:      result.Action == userwatchgo.Outcome_CHALLENGE,
			ChallengeTypes: result.SupportedChallenges,
		}

		if result.Action == userwatchgo.Outcome_DENY {
			status = http.StatusForbidden
		} else if result.Action == userwatchgo.Outcome_CHALLENGE && !isAccountSharing {
			status = http.StatusUnauthorized
		} else if result.Action == userwatchgo.Outcome_CHALLENGE && isAccountSharing {
			status = http.StatusOK
		}

		rw.WriteHeader(status)
		rw.Header().Set("Content-Type", "application/json")
		json.NewEncoder(rw).Encode(response)
	}
}

func (w *Web) HandleDeviceList(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var request userwatchgo.DeviceListRequest
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
	Type        userwatchgo.ChallengeType `json:"challengeType,omitempty"`
	PhoneNumber string                    `json:"phoneNumber"`
	DeviceID    string                    `json:"deviceID,omitempty"`
	Origin      string                    `json:"origin,omitempty"`
}

func (w *Web) HandleCreateChallenge(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var request CreateChallengeRequest
	json.NewDecoder(r.Body).Decode(&request)

	response, err := w.uwclient.CreateChallenge(ctx, &userwatchgo.CreateChallengeRequest{
		Type:     request.Type,
		DeviceID: request.DeviceID,
		Origin:   request.Origin,
		Userinfo: &userwatchgo.UserInfo{
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
