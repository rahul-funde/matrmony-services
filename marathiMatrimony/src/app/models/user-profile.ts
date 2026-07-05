export interface PhotoDetails {
  profilePicture?: { filename: string }[];
  familyPicture?: { filename: string };
}


export class UserProfile {
    fullName!: string;
    dateOfBirth!: string;
    age?: string;
    photoDetails?: PhotoDetails;
    profileCompletion?: number;
    // gender: any ;
    // religion!: string;
    // caste!: string;
    // subCaste!: string;
    // maritalStatus!: string;
    // // heightFeet!: number;
    // heightInches!: number;
    // heightCm?: number;
    // complexion!: string;
    // physicalDisability!: string;
    // disabilityDetails?: string;
    // weight!: number;
    // bloodGroup!: string;
    // languagesSpoken!: string[];
    // diet!: string;
    // spectacles!: boolean;
    // lens!: string;    
}

