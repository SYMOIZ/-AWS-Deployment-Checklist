# AWS Deployment Checklist

A small, professional static web app for the AWS Builder Center **Deploy Your First App Weekend Challenge**. It helps developers track the basic steps of deploying an application to Amazon S3, with HTTPS via CloudFront.

## What it is

Users open a single page, work through a preflight deployment checklist, mark items complete, add their own tasks, and watch progress update live. When every task is done, a completion message appears. Checklist state (including custom items) is saved in the browser with `localStorage`. There is no login, no backend, and no database.

## Features

- Title and short purpose description
- Default AWS deployment checklist items (including HTTPS / certificate step)
- **Add your own checklist items** (with optional hint)
- Remove custom items
- Interactive checkboxes
- Progress percentage and visual progress bar
- Completed vs remaining task counts
- Completion state when all tasks are finished
- Reset checks button
- Responsive layout for desktop and mobile
- Browser `localStorage` persistence

## Architecture

```text
User Browser (HTTPS) → Amazon CloudFront (TLS certificate) → Amazon S3 website origin → HTML / CSS / JavaScript
```

CloudFront terminates HTTPS using the **CloudFront default certificate** (`*.cloudfront.net`). The origin is the S3 static website endpoint.

## AWS Services Used

### Amazon S3

- Bucket: `<BUCKET_NAME>`
- Region: `us-east-1`
- Static website hosting enabled with `index.html` and `error.html`
- Public read limited to `s3:GetObject` on objects in this bucket only

### Amazon CloudFront

- Distribution ID: `<CLOUDFRONT_DISTRIBUTION_ID>`
- Domain: `d1zv57qzf6epld.cloudfront.net`
- Viewer protocol: redirect HTTP → HTTPS
- Certificate: CloudFront default TLS certificate
- Origin: `<BUCKET_NAME>.s3-website-us-east-1.amazonaws.com`

No Lambda, API Gateway, DynamoDB, Cognito, or custom ACM domain certificate was required for this HTTPS URL.

## Deployment

1. Created S3 bucket and enabled static website hosting
2. Applied public `s3:GetObject` bucket policy
3. Uploaded `index.html`, `styles.css`, `app.js`, and `error.html`
4. Created a CloudFront distribution with the CloudFront default certificate and `redirect-to-https`
5. Verified the HTTPS URL after the distribution reached `Deployed`

## Testing

### Local / functional

- Checklist renders with default tasks
- Add-item form creates custom tasks and persists them
- Remove deletes custom tasks
- Progress, completion, and reset work as expected

### Live HTTPS

- `https://d1zv57qzf6epld.cloudfront.net` returned HTTP 200
- `styles.css` and `app.js` returned HTTP 200 over HTTPS
- Add-item UI verified on the live CloudFront URL
- Connection used TLS (`ssl_verify_result=0`)

## Live Website

**HTTPS (recommended):** https://d1zv57qzf6epld.cloudfront.net

## Project Structure

```text
builder leader/
├── index.html      # Main page + add-item form
├── styles.css      # Self-contained styles
├── app.js          # Checklist logic, custom items, localStorage
├── error.html      # Error document
└── README.md       # This file
```

## Dependencies

This application has **zero third-party runtime dependencies**.

It uses only:

- HTML
- CSS
- Vanilla JavaScript
- Native browser APIs (`localStorage`)
- Amazon S3 and Amazon CloudFront for hosting / HTTPS
