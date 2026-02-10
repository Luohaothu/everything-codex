package main

import "testing"

func TestAdd(t *testing.T) {
	result, err := Add(2, 3)
	if err != nil {
		t.Fatal(err)
	}
	if result != 5 {
		t.Errorf("expected 5, got %d", result)
	}
}

// TestAddNegative is intentionally failing to demonstrate TDD.
func TestAddNegative(t *testing.T) {
	_, err := Add(-1, 5)
	if err == nil {
		t.Error("expected error for negative input, got nil")
	}
}

func TestDivide(t *testing.T) {
	result := Divide(10, 2)
	if result != 5 {
		t.Errorf("expected 5, got %d", result)
	}
}

// TestDivideByZero should panic — no guard (intentional for testing).
func TestDivideByZero(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Error("expected panic for division by zero")
		}
	}()
	Divide(10, 0)
}
