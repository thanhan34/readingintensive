# Reading Intensive - PTE Practice Application

A Next.js application for practicing PTE Reading Writing Fill in the Blanks (RWFIB) and Reading Fill in the Blanks (RFIB) questions, with word definitions in Vietnamese and related images.

## Features

- Practice RWFIB and RFIB questions
- Click on words to see:
  - Vietnamese translations
  - Related images
- Admin panel for managing questions:
  - Upload questions via Excel files
  - Review and validate questions before submission
  - Firebase authentication for admin access

## Tech Stack

- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- Firebase (Authentication, Firestore)
- Google Cloud Translation API
- Unsplash API
- XLSX for Excel parsing

## Setup Instructions

1. Clone the repository:
```bash
git clone [repository-url]
cd reading-intensive
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
- Create a new Firebase project
- Enable Authentication and Firestore
- Create an admin user with email/password
- Get your Firebase configuration
- Add configuration to `.env.local`

4. Set up Google Cloud Translation API:
- Create a Google Cloud project
- Enable the Cloud Translation API
- Create a service account and download credentials
- Add credentials to `.env.local`

5. Set up Unsplash API:
- Create an Unsplash Developer account
- Create a new application
- Get your access key
- Add the access key to `.env.local`

6. Configure environment variables:
Create a `.env.local` file with the following variables:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Cloud Translation API
GOOGLE_TRANSLATE_CLIENT_EMAIL=your_client_email
GOOGLE_TRANSLATE_PRIVATE_KEY=your_private_key
GOOGLE_CLOUD_PROJECT_ID=your_project_id

# Unsplash API
UNSPLASH_ACCESS_KEY=your_access_key
```

7. Run the development server:
```bash
npm run dev
```

8. Access the application:
- Main practice page: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`

## Excel File Format

When uploading questions through the admin panel, your Excel file should have the following columns:

| title | content | type |
|-------|---------|------|
| Question Title | Full question text | RWFIB or RFIB |

## Firebase Firestore Structure

```
/questions
  /{questionId}
    - title: string
    - content: string
    - type: "RWFIB" | "RFIB"

/definitions
  /{word}
    - vietnamese: string
    - images: string[]
```

## Development

### Project Structure

```
src/
  ├── app/
  │   ├── api/
  │   │   ├── images/
  │   │   └── translate/
  │   ├── admin/
  │   └── page.tsx
  ├── components/
  │   ├── ExcelUploader.tsx
  │   ├── QuestionContent.tsx
  │   ├── QuestionReviewTable.tsx
  │   └── Sidebar.tsx
  └── lib/
      └── firebase.ts
```

### Adding New Features

1. Create new components in `src/components`
2. Add new API routes in `src/app/api`
3. Update Firebase security rules as needed
4. Test thoroughly before deploying

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to your preferred platform:
- Vercel (recommended)
- Firebase Hosting
- Any other platform that supports Next.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
