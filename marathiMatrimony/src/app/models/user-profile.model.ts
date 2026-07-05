export interface UserProfile {
  personalDetails: {
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    age: number;
    gender: string;
    religion: string;
    caste: string;
    subCaste: string;
    maritalStatus: string;
    height?: string;
    heightUnit: string;
    complexion: string;
    physicalDisability: string;
    disabilityDetails?: string;
    weight: number;
    bloodGroup: string;
    languagesSpoken?: string;
    diet?: string;
    spectacles?: string;
    lens?: string;
  };
  horoscopeDetails: {
    rashi: string;
    nakshatra: string;
    charan: string;
    nadi: string;
    gan: string;
    mangal: string;
    birthTime: string;
    birthPlace: string;
    deva: string;
  };
  familyDetails: {
    father: string;
    fatherName?: string;
    fatherOccupation?: string;
    mother: string;
    motherName?: string;
    motherOccupation?: string;
    hasBrothers?: string;
    brothersCount?: string;
    brothersMarriedCount?: string;
    hasSisters?: string;
    sistersCount?: string;
    sistersMarriedCount?: string;
    parentsResidentCity?: string;
    relativesSurnames?: string;
    familyWealth?: string;
    mamaNameAndPlace?: string;
    nativeDistrict: string;
    otherDistrict?: string;
    nativeTaluka?: string;
    intercasteMarriage: string;
    intercasteDetails?: string;
    siblingsDetails?: string;
    familyType: string;
  };
  educationDetails: {
    highestQualification: string;
    collegeName: string;
    yearOfCompletion: string;
    additionalQualifications?: string;
    educationType: string;
  };
  careerDetails: {
    occupation: string;
    jobTitle: string;
    companyName: string;
    annualIncome: string;
    workLocationCity: string;
    workLocationCountry: string;
    employmentType: string;
    previousWorkExperience?: string;
  };
  lifestyleDetails: {
    diet: string;
    smoking: string;
    drinking: string;
    hobbies?: string;
    sportsActivities?: string;
    favoriteBooks?: string;
    favoriteMovies?: string;
    favoritetvShows?: string;
  };
  partnerPreferencesDetails: {
    ageRange?: string;
    heightPreference: string;
    religionCastePreferences?: string;
    educationPreferences?: string;
    occupationPreferences?: string;
    locationPreferences?: string;
    languagesPreferences?: string;
    lifestylePreferences?: string;
  };
  contactDetails: {
    emailAddress: string;
    phoneNumber: string;
    city: string;
    state: string;
    country: string;
  };
  photoDetails: {
    profilePicture?: any;
    familyPicture?: any;
  };
  additionalInfoDetails: {
    personalDescription: string;
    reasonForPartner: string;
    partnerExpectations: string;
  };
}
