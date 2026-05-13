export type SignupRole = "admin" | "storekeeper";

export type RegisterPayload = {
  fullName: string;
  email:    string;
  password: string;
  role:     SignupRole;
};

export type RegisterResponse = {
  id:       string;
  email:    string;
  fullName: string;
};
