// Package token provides JWT signing and verification utilities.
//
// The Go API signs tokens on login; the auth middleware verifies them on every
// protected request.  Express does not produce or consume these tokens — it
// continues to use the stateless X-User-Id header pattern for its own routes.
package token

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"sciblock/go-api/internal/domain"
)

// Claims extends jwt.RegisteredClaims with application-specific fields.
type Claims struct {
	jwt.RegisteredClaims
	UserID string      `json:"uid"`
	Email  string      `json:"email"`
	Name   string      `json:"name"`
	Role   domain.Role `json:"role"`
}

// Sign creates a signed JWT string for the given user.
// expiryHours controls how long the token is valid.
func Sign(user *domain.User, secret string, expiryHours int) (string, error) {
	now := time.Now()
	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(expiryHours) * time.Hour)),
		},
		UserID: user.ID,
		Email:  user.Email,
		Name:   user.Name,
		Role:   user.Role,
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := t.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}
	return signed, nil
}

// Verify parses and validates a JWT string, returning the embedded claims.
// Returns an error if the token is expired, malformed, or uses the wrong key.
func Verify(tokenStr, secret string) (*domain.TokenClaims, error) {
	t, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := t.Claims.(*Claims)
	if !ok || !t.Valid {
		return nil, errors.New("invalid token claims")
	}

	return &domain.TokenClaims{
		UserID: claims.UserID,
		Email:  claims.Email,
		Name:   claims.Name,
		Role:   claims.Role,
	}, nil
}
