package main

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"

	"github.com/thoas/go-funk"

	upollo "github.com/upollo/userwatch-go"
)

type Web struct {
	uwclient upollo.ShepherdClient
}

func (w *Web) HandleLogin(rw http.ResponseWriter, r *http.Request) {
	HandleRegisterOrLogin(w, rw, r, false /* register */)
}

func (w *Web) HandleRegister(rw http.ResponseWriter, r *http.Request) {
	HandleRegisterOrLogin(w, rw, r, true /* register */)
}

type RegisterRequest struct {
	UserEmail         string `json:"userEmail"`
	EventToken        string `json:"eventToken"`
	ChallengeId       string `json:"challengeId,omitempty"`
	ChallengeSecret   string `json:"challengeSecret,omitempty"`
	ChallengeWebauthn string `json:"challengeWebauthnResponse,omitempty"`
}

type RegisterResponse struct {
	DeviceId       string                 `json:"deviceId"`
	UserId         string                 `json:"userId,omitempty"`
	Challenge      bool                   `json:"challenge,omitempty"`
	Upsell         bool                   `json:"upsell,omitempty"`
	ChallengeTypes []upollo.ChallengeType `json:"challengeTypes,omitempty"`
}

func HandleRegisterOrLogin(w *Web, rw http.ResponseWriter, r *http.Request, register bool) {
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
	if request.ChallengeId != "" && request.ChallengeSecret != "" {
		challengeVerification = &upollo.ChallengeVerificationRequest{
			ChallengeId:    request.ChallengeId,
			SecretResponse: request.ChallengeSecret,
			Type:           upollo.ChallengeType_CHALLENGE_TYPE_SMS,
		}
	} else if request.ChallengeId != "" && request.ChallengeWebauthn != "" {
		challengeB64, err := base64.StdEncoding.DecodeString(request.ChallengeWebauthn)
		if err != nil {
			log.Printf("Unable to decode webauthn challenge as b64, %v", err)
		}
		if challengeB64 != nil {
			challengeVerification = &upollo.ChallengeVerificationRequest{
				ChallengeId:                request.ChallengeId,
				WebauthnCredentialResponse: challengeB64,
				Type:                       upollo.ChallengeType_CHALLENGE_TYPE_WEBAUTHN,
			}
		}
	}

	result, err := w.uwclient.Verify(ctx, &upollo.VerifyRequest{
		EventToken: request.EventToken,
		Userinfo: &upollo.UserInfo{
			UserEmail: request.UserEmail,
		},
		ChallengeVerification: challengeVerification,
	})

	if err != nil {
		log.Printf("invalid response from validate %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
	} else {
		isAccountSharing := funk.Contains(result.Flags, func(flag *upollo.Flag) bool {
			return flag.Type == upollo.FlagType_ACCOUNT_SHARING
		})
		hadPreviousTrial := funk.Contains(result.Flags, func(flag *upollo.Flag) bool {
			return flag.Type == upollo.FlagType_MULTIPLE_ACCOUNTS
		})
		// A previous trial was detected while the user was registering, or account sharing was
		// detected while the user was logging in.
		upsell := (register && hadPreviousTrial) || (!register && isAccountSharing)
		response := RegisterResponse{
			DeviceId:       result.DeviceInfo.DeviceId,
			UserId:         result.UserInfo.UserId,
			Upsell:         upsell,
			Challenge:      result.Action == upollo.Outcome_OUTCOME_CHALLENGE,
			ChallengeTypes: result.SupportedChallenges,
		}

		status := http.StatusOK
		if result.Action == upollo.Outcome_OUTCOME_DENY {
			status = http.StatusForbidden
		} else if result.Action == upollo.Outcome_OUTCOME_CHALLENGE && !(isAccountSharing || hadPreviousTrial) {
			status = http.StatusUnauthorized
		} else if result.Action == upollo.Outcome_OUTCOME_CHALLENGE && (isAccountSharing || hadPreviousTrial) {
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
	PhoneNumber string               `json:"phoneNumber"`
	DeviceId    string               `json:"deviceId,omitempty"`
	Origin      string               `json:"origin,omitempty"`
}

func (w *Web) HandleCreateChallenge(rw http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var request CreateChallengeRequest
	json.NewDecoder(r.Body).Decode(&request)

	response, err := w.uwclient.CreateChallenge(ctx, &upollo.CreateChallengeRequest{
		Type:     request.Type,
		DeviceId: request.DeviceId,
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
