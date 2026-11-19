import type { Messages } from './bn';

export const en: Messages = {
  app: {
    title: 'Kaaj – The Job',
    tagline: 'Connecting Bangladesh to better work.',
  },
  nav: {
    label: 'Main menu',
    home: 'Kaaj home',
    howItWorks: 'How it works',
    skipToContent: 'Skip to main content',
  },
  language: {
    label: 'Language',
    bn: 'বাংলা',
    bnShort: 'বাং',
    en: 'English',
    enShort: 'EN',
  },
  account: {
    signIn: 'Sign in',
    createAccount: 'Create account',
    menu: 'Your account',
    signedInAs: 'Signed in as',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
    signOutFailed: "We couldn't sign you out. Please try again.",
    role: {
      SEEKER: 'Job seeker',
      EMPLOYER: 'Employer',
      ADMIN: 'Admin',
    },
    status: {
      ACTIVE: 'Active',
      SUSPENDED: 'Suspended',
    },
  },
  footer: {
    copyright: '© {{year}} Kaaj. Connecting Bangladesh to better work.',
    freeForWorkers: 'Always free for workers',
  },
  common: {
    loading: 'Loading…',
    comingSoon: 'Coming soon',
    goHome: 'Go to home',
    tryAgain: 'Try again',
    reload: 'Reload the page',
    showPassword: 'Show password',
  },
  errors: {
    network: "Can't reach Kaaj. Check your internet connection and try again.",
    server: 'Something went wrong on our side. Please try again in a moment.',
    tooMany: 'Too many tries. Please wait a moment and try again.',
    signInRequired: 'Please sign in.',
    forbidden: "You don't have permission to do this.",
    validation: 'Please check the highlighted fields.',
    unknown: 'Something went wrong. Please try again.',
    serverUnreachable: "We can't reach the Kaaj server right now. Some things may not work.",
  },
  validation: {
    emailRequired: 'Enter your email address.',
    emailInvalid: 'Enter a valid email address, like name@example.com',
    passwordRequired: 'Enter your password.',
    passwordTooShort: 'Use at least 8 characters.',
    passwordTooLong: 'Use at most 64 characters.',
    roleRequired: 'Choose job seeker or employer.',
    codeLength: 'Enter the 6-digit code from the email.',
  },
  home: {
    title: 'Home',
    hero: {
      badge: 'Always free for workers',
      title: 'Tell us what you can do. Find work near you.',
      subtitle:
        'Kaaj connects job seekers with verified employers across Bangladesh. Every job shows its wage up front, and your phone number stays private.',
      primary: 'Create a free account',
      secondary: 'Sign in',
    },
    example: {
      label: 'Example: what a job card will look like',
      title: 'Pickup driver',
      employer: 'Karim Transport',
      verified: 'Verified',
      place: 'Tongi, Gazipur · {{km}} km away',
      perMonth: '/ month',
      fullTime: 'Full-time',
      dayShift: 'Day shift',
      reason: 'Matches your driving licence',
    },
    how: {
      title: 'How Kaaj works',
      seekers: {
        title: 'For job seekers',
        step1: {
          title: 'Create your profile',
          text: 'Fill in a short form, or just say what work you do.',
        },
        step2: {
          title: 'See jobs that fit',
          text: 'Every job shows the wage, the shift and how far it is from your home.',
        },
        step3: {
          title: 'Apply with one tap',
          text: 'No CV needed. Your Kaaj profile is your application.',
        },
        cta: 'Sign up as a job seeker',
      },
      employers: {
        title: 'For employers',
        step1: {
          title: 'Get verified',
          text: 'Add your business details once and earn the "Verified" badge.',
        },
        step2: {
          title: 'Post a job easily',
          text: 'Describe the job in one sentence, and Kaaj drafts the full post.',
        },
        step3: {
          title: 'Hire the right people',
          text: 'See applicants ranked by fit, and talk without sharing your phone number.',
        },
        cta: 'Sign up as an employer',
      },
    },
    welcome: {
      title: 'Welcome to Kaaj',
      subtitle: "You're signed in as {{email}}.",
    },
    account: {
      title: 'Your account',
      email: 'Email',
      type: 'Account type',
      status: 'Status',
    },
    next: {
      title: "What you'll be able to do soon",
      SEEKER: {
        one: 'Build your profile: your skills, work area and expected pay.',
        two: 'Add your licences and certificates to get a "Verified" badge.',
        three: 'Find jobs near you and apply with one tap.',
      },
      EMPLOYER: {
        one: 'Add your business details and get verified.',
        two: 'Post jobs with the wage, hours and place.',
        three: 'See applicants ranked by fit.',
      },
      ADMIN: {
        one: 'Verify employers and documents.',
        two: 'Review reported and suspicious job posts.',
        three: 'Manage user accounts.',
      },
    },
  },
  auth: {
    google: 'Continue with Google',
    email: 'Email',
    emailPlaceholder: 'name@example.com',
    password: 'Password',
    why: {
      title: 'Why Kaaj?',
      wages: {
        title: 'Wages up front',
        text: 'Every job post must show its pay.',
      },
      safe: {
        title: 'Protected from scams',
        text: 'Every post is checked. Job seekers never pay a fee.',
      },
      private: {
        title: 'Your number stays private',
        text: 'Talk to employers inside Kaaj.',
      },
    },
    login: {
      title: 'Sign in',
      subtitle: 'Welcome back! Sign in to your Kaaj account.',
      orEmail: 'or sign in with email',
      submit: 'Sign in',
      submitting: 'Signing in…',
      noAccount: 'New to Kaaj?',
      createAccount: 'Create an account',
      sendCode: 'Send me a new code',
      sendingCode: 'Sending the code…',
      googleErrors: {
        chooseRole:
          "There's no Kaaj account for this Google account yet. Create an account first, and choose job seeker or employer.",
        emailNotVerified:
          'Your Google email is not verified. Verify it with Google, or create an account with your email.',
        suspended: 'This account is suspended.',
        generic: "Google sign-in didn't work. Please try again.",
      },
    },
    register: {
      title: 'Create your Kaaj account',
      subtitle: 'It takes a minute. Always free for job seekers.',
      roleLegend: 'What kind of account do you need?',
      roleNote: 'Choose carefully: only an admin can change it later.',
      roles: {
        SEEKER: {
          title: 'Job seeker',
          text: "I'm looking for work",
        },
        EMPLOYER: {
          title: 'Employer',
          text: 'I want to hire people',
        },
      },
      orEmail: 'or create an account with email',
      passwordHint: 'At least 8 characters.',
      submit: 'Create account',
      submitting: 'Creating your account…',
      haveAccount: 'Already have an account?',
      signIn: 'Sign in',
    },
    verify: {
      title: 'Confirm your email',
      subtitle: 'We sent a 6-digit code to <b>{{email}}</b>. The code works for 10 minutes.',
      subtitleNoEmail: 'Enter your email address and the 6-digit code we sent you.',
      code: '6-digit code',
      codeHint: "If you can't find the email, check your spam folder.",
      devHint: 'Development mode: the code is printed in the backend terminal.',
      submit: 'Confirm',
      submitting: 'Checking…',
      noCode: "Didn't get a code?",
      resend: 'Send a new code',
      resending: 'Sending…',
      resendIn: 'You can ask for a new code in {{seconds}} seconds.',
      resent: 'We sent a new code. Check your email.',
      changeEmail: 'Wrong email? Start again',
      alreadyConfirmed: 'Already confirmed?',
      signIn: 'Sign in',
    },
  },
  guard: {
    noAccessTitle: "This page isn't for your account",
    noAccessText: "Your account type can't open this page.",
  },
  notFound: {
    title: 'Page not found',
    text: "The page you're looking for doesn't exist, or it has moved.",
  },
  routeError: {
    title: 'Something went wrong',
    text: 'Please reload the page. If it keeps happening, try again a little later.',
  },
};
