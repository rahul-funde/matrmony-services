// src/app/models/admin-login.model.ts
export interface AdminLogin {
    identifier: string;
    password: string;
  }
  

export interface AdminLoginResponse {
    token: string;
    admin?: {
      id: string;
      name: string;
      email: string;
    };
  }
  