// By Rahul Funde
// Date: 2025-03-15
// Purpose: Defines the User model for registration in Couchbase.

class User {
    constructor(id, firstname, middlename, surname, dob, gender, mobilenumber, email, password,otp) {
      this.id = id;
      this.firstname = firstname;
      this.middlename = middlename;
      this.surname = surname;
      this.dob = dob;
      this.gender = gender;
      this.mobileno = mobilenumber;
      this.email = email;
      this.password = password;
      this.otp = otp
      this.type = "user"; // Used for indexing
    }
  }
  
  module.exports = User;
  