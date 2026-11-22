export default {
  // Navigation
  nav: {
    locations: 'Lokacije',
    recent: 'Nedavno',
    priority: 'Prioriteti',
    settings: 'Postavke',
  },

  // Auth
  auth: {
    login: 'Prijava',
    register: 'Registracija',
    email: 'Email',
    password: 'Lozinka',
    confirmPassword: 'Potvrdi lozinku',
    loginButton: 'Prijavi se',
    registerButton: 'Registriraj se',
    googleButton: 'Nastavi s Googleom',
    switchToRegister: 'Nemaš račun? Registriraj se',
    switchToLogin: 'Već imaš račun? Prijavi se',
    passwordMismatch: 'Lozinke se ne podudaraju',
    fillAllFields: 'Popuni sva polja',
  },

  // Locations
  locations: {
    add: 'Nova lokacija',
    namePlaceholder: 'npr. Pčelinjak Kuljani',
    empty: 'Nema lokacija',
    emptyDesc: 'Dodaj svoju prvu lokaciju pčelinjaka',
    delete: 'Obriši lokaciju',
    deleteConfirm:
      'Jesi li siguran/na da želiš obrisati ovu lokaciju i sve njene košnice i snimke?',
  },

  // Beehives
  beehives: {
    title: 'Košnice',
    add: 'Nova košnica',
    namePlaceholder: 'npr. Košnica 1',
    recordingCount_one: '{{count}} snimka',
    recordingCount_few: '{{count}} snimke',
    recordingCount_other: '{{count}} snimki',
    empty: 'Nema košnica',
    emptyDesc: 'Dodaj svoju prvu košnicu na ovoj lokaciji',
    delete: 'Obriši košnicu',
    deleteConfirm: 'Jesi li siguran/na da želiš obrisati ovu košnicu i sve njene snimke?',
    location: 'Lokacija',
  },

  // Recordings
  recordings: {
    title: 'Snimke',
    add: 'Nova snimka',
    empty: 'Nema snimki',
    emptyDesc: 'Snimi svoju prvu glasovnu bilješku',
    delete: 'Obriši snimku',
    deleteConfirm: 'Jesi li siguran/na da želiš obrisati ovu snimku?',
    duration: 'Trajanje',
    lastListened: 'Poslušano',
    tapToStop: 'Pritisni za zaustavljanje',
    tapToStart: 'Pritisni za snimanje',
    selectBeehive: 'Odaberi košnicu',
    selectLocation: 'Odaberi lokaciju',
    setPriority: 'Postavi prioritet',
    saving: 'Spremanje...',
    saved: 'Snimka spremljena',
    solved: 'Riješeno',
    unsolved: 'Neriješeno',
    micPermission: 'Potrebna dozvola za mikrofon',
    notes: 'Bilješke',
    notesPlaceholder: 'Dodaj bilješke o pregledu...',
    takePhoto: 'Slikaj',
    chooseFromGallery: 'Odaberi iz galerije',
    photos: 'Fotografije',
  },

  // Priority
  priority: {
    high: 'Visok',
    medium: 'Srednji',
    low: 'Nizak',
  },

  // Onboarding
  onboarding: {
    welcome: 'Dobrodošli u BuzzNotes',
    subtitle: 'Tvoj pčelarski dnevnik glasovnih bilješki',
    feature1: 'Organiziraj pčelinjake po lokaciji',
    feature2: 'Prati svaku košnicu',
    feature3: 'Snimaj glasovne bilješke s prioritetom',
    getStarted: 'Započni',
  },

  // Common
  common: {
    save: 'Spremi',
    cancel: 'Odustani',
    delete: 'Obriši',
    search: 'Pretraži...',
    loading: 'Učitavanje...',
    error: 'Greška',
    success: 'Uspjeh',
    create: 'Stvori',
    sync: 'Sinkronizacija',
    syncing: 'Sinkroniziranje...',
    synced: 'Sinkronizirano',
    syncError: 'Greška pri sinkronizaciji',
    offline: 'Izvan mreže',
    language: 'Jezik',
    export: 'Izvoz',
    import: 'Uvoz',
    exporting: 'Izvoženje...',
    importing: 'Uvoženje...',
    exportSuccess: 'Podaci uspješno izvezeni',
    importSuccess: 'Podaci uspješno uvezeni',
    importError: 'Greška pri uvozu podataka',
    loadError:
      'Spremljene podatke nije moguće učitati. Ništa nije prepisano; povuci prema dolje za ponovni pokušaj',
    saveError: 'Promjene nije moguće spremiti',
    storageFull:
      'Previše podataka; promjene se ne spremaju. Izvezi sigurnosnu kopiju pa obriši stare snimke',
    webUnavailable: 'Snimanje, fotografije te izvoz i uvoz dostupni su samo u Android aplikaciji',
    beehiveLabel_one: 'košnica',
    beehiveLabel_few: 'košnice',
    beehiveLabel_other: 'košnica',
    recordingLabel_one: 'snimka',
    recordingLabel_few: 'snimke',
    recordingLabel_other: 'snimki',
  },
};
