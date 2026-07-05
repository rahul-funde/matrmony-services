export interface LoginRequest {
    identifier: string; // Email or Mobile Number
    password: string;
  }
  
  export interface LoginResponse {
    token: string;
    user: User;
  }
  
  // export interface User {
  //   firstname: string;
  //   middlename: string;
  //   lastname: string;
  //   dob: string;
  //   gender: string;
  //   mobilenumber: string;
  //   email: string;
  //   password: string;
  // }
export interface User {
  lastname: string;
  email: string;
  mobilenumber: string;
  gender: string;
  partnerPreferencesDetails?: {
    ageRange: string;
    heightPreference: string;
    religionCastePreferences: string;
    educationPreferences: string;
    occupationPreferences: string;
    locationPreferences: string;
    languagesPreferences: string;
    lifestylePreferences: string;
  };
}


  export interface ResetPassword {
    token: string;
    newPassword: string;
  }
  
    