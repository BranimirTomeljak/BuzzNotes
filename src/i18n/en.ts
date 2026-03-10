export default {
  // Navigation
  nav: {
    locations: 'Locations',
    recent: 'Recent',
    priority: 'Priority',
    settings: 'Settings',
  },

  // Auth
  auth: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    loginButton: 'Sign In',
    registerButton: 'Sign Up',
    googleButton: 'Continue with Google',
    switchToRegister: "Don't have an account? Sign Up",
    switchToLogin: 'Already have an account? Sign In',
    passwordMismatch: 'Passwords do not match',
    fillAllFields: 'Please fill all fields',
  },

  // Locations
  locations: {
    add: 'New location',
    namePlaceholder: 'e.g. Kuljani Apiary',
    empty: 'No locations',
    emptyDesc: 'Add your first apiary location',
    delete: 'Delete location',
    deleteConfirm:
      'Are you sure you want to delete this location and all its beehives and recordings?',
  },

  // Beehives
  beehives: {
    title: 'Beehives',
    add: 'New beehive',
    namePlaceholder: 'e.g. Beehive 1',
    recordingCount: '{{count}} recording',
    recordingCount_plural: '{{count}} recordings',
    empty: 'No beehives',
    emptyDesc: 'Add your first beehive to this location',
    delete: 'Delete beehive',
    deleteConfirm: 'Are you sure you want to delete this beehive and all its recordings?',
    location: 'Location',
  },

  // Recordings
  recordings: {
    title: 'Recordings',
    add: 'New recording',
    empty: 'No recordings',
    emptyDesc: 'Record your first voice note',
    delete: 'Delete recording',
    deleteConfirm: 'Are you sure you want to delete this recording?',
    duration: 'Duration',
    lastListened: 'Listened',
    tapToStop: 'Tap to stop',
    tapToStart: 'Tap to record',
    selectBeehive: 'Select beehive',
    selectLocation: 'Select location',
    setPriority: 'Set priority',
    saving: 'Saving...',
    saved: 'Recording saved',
    solved: 'Solved',
    unsolved: 'Unsolved',
    micPermission: 'Microphone permission required',
    notes: 'Notes',
    notesPlaceholder: 'Add inspection notes...',
    takePhoto: 'Take photo',
    chooseFromGallery: 'Choose from gallery',
    photos: 'Photos',
  },

  // Priority
  priority: {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },

  // Onboarding
  onboarding: {
    welcome: 'Welcome to BuzzNotes',
    subtitle: 'Your beekeeper voice notes companion',
    feature1: 'Organize apiaries by location',
    feature2: 'Track each beehive',
    feature3: 'Record voice notes with priority',
    getStarted: 'Get Started',
  },

  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    search: 'Search...',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    create: 'Create',
    sync: 'Sync',
    syncing: 'Syncing...',
    synced: 'Synced',
    syncError: 'Sync error',
    offline: 'Offline',
    language: 'Language',
    export: 'Export',
    import: 'Import',
    exporting: 'Exporting...',
    exportSuccess: 'Data exported successfully',
    importSuccess: 'Data imported successfully',
    importError: 'Error importing data',
  },
};
