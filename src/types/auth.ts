export type RegisterPayload = {
  fullName: string;
  email:    string;
  password: string;
};

export type RegisterResponse = {
  id:       string;
  email:    string;
  fullName: string;
};
