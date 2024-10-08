package main

type CustomValidator struct{}

func (v *CustomValidator) Validate(key string, value []byte) error {
	return nil
}

func (v *CustomValidator) Select(key string, values [][]byte) (int, error) {
	return 0, nil
}
