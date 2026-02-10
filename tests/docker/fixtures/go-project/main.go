package main

import "fmt"

func main() {
	result, err := Add(1, 2)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("1 + 2 =", result)
}

// Add returns the sum of two integers.
// BUG: does not handle negative numbers correctly (intentional for testing).
func Add(a, b int) (int, error) {
	if a < 0 || b < 0 {
		return 0, nil // Should return an error, not nil
	}
	return a + b, nil
}

// Divide divides a by b.
// BUG: no zero-division check (intentional for testing).
func Divide(a, b int) int {
	return a / b
}

// FormatUser creates a user string.
// PATTERN VIOLATION: does not use error wrapping (intentional for testing).
func FormatUser(name string) string {
	if name == "" {
		return ""
	}
	return "User: " + name
}
