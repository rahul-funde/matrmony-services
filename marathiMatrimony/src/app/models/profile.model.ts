export interface ProfileModel {
  id: number;
  userId: string;
  age: number;
  profileCompletion?: number;
  hasInterest?: boolean;
  showContact?: boolean;
  lastLogin?: string;
  start_date?: string;
  end_date?: string;
  plan?: string;
  status?: string;
  matchScore: string;
  interestStatus: string;
  isLoading?: boolean;
  // Photos
  photoUrl: { filename: string }[] | null;
  photoDetails: {
    profilePicture: { filename: string }[];
    familyPicture?: { filename: string }[];
    [key: string]: any; // for any future photo fields
  };

  // Personal Information
  personalDetails: {
    firstName: string;
    middleName?: string;
    lastName: string;
    age?: number;
    gender?: string | null;
    religion?: string;
    caste?: string;
    subCaste?: string;
    maritalStatus?: string;
    bloodGroup?: string;
    height?: string;
    heightUnit?: string;
    weight?: string;
    spectacles?: string;
    lens?: string;
    diet?: string;
    personalDiet?: string;
    languagesSpoken?: string;
    dateOfBirth?: string;
    physicalDisability?: string;
    disabilityDetails?: string;
    complexion?: string;
  };

  // Contact Information
  contactDetails: {
    city?: string;
    state?: string;
    country?: string;
    emailAddress?: string;
    phoneNumber?: string;
  };

  // Education
  educationDetails: {
    highestQualification?: string;
    additionalQualifications?: string;
    collegeName?: string;
    yearOfCompletion?: string;
    educationType?: string;
  };

  // Career
  careerDetails: {
    occupation?: string;
    jobTitle?: string;
    companyName?: string;
    annualIncome?: string;
    employmentType?: string;
    workLocationCity?: string;
    workLocationCountry?: string;
    previousWorkExperience?: string;
  };

  // Lifestyle
  lifestyleDetails: {
    diet?: string;
    lifestyleDiet?: string;
    lifestylePreferences?: string;
    smoking?: string;
    drinking?: string;
    hobbies?: string;
    sportsActivities?: string;
    favoriteBooks?: string;
    favoriteMovies?: string;
    favoritetvShows?: string;
  };

  // Family Details
  familyDetails: {
    father?: string;
    fatherName?: string;
    fatherOccupation?: string;
    fatherContactNumber?: string;
    mother?: string;
    motherName?: string;
    motherOccupation?: string;
    motherContactNumber?: string;
    hasBrothers?: string;
    brothersCount?: number;
    brothersMarriedCount?: number;
    hasSisters?: string;
    sistersCount?: number;
    sistersMarriedCount?: number;
    parentsResidentCity?: string;
    relativesSurnames?: string;
    mamaNameAndPlace?: string;
    nativeDistrict?: string;
    otherDistrict?: string;
    nativeTaluka?: string;
    familyWealth?: string;
    familyType?: string;
    intercasteMarriage?: string;
    intercasteDetails?: string;
    siblingsDetails?: string;
  };

  // Horoscope
  horoscopeDetails: {
    navsarNav?: string;
    rashi?: string;
    nakshatra?: string;
    charan?: string;
    nadi?: string;
    gan?: string;
    mangal?: string;
    deva?: string;
    birthTime?: string;
    birthPlace?: string;
  };

  // Partner Preferences
  partnerPreferencesDetails: {
    ageRange?: string;
    heightPreference?: string;
    religionCastePreferences?: string;
    educationPreferences?: string;
    occupationPreferences?: string;
    locationPreferences?: string;
    languagesPreferences?: string;
    lifestylePreferences?: string;
  };

  // Additional Info
  additionalInfoDetails: {
    personalDescription?: string;
    reasonForPartner?: string;
    partnerExpectations?: string;
  };

  // Dynamic / future fields (optional catch-all)
  // [key: string]: any;
}
