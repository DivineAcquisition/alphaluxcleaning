# Bay Area Cleaning Pros - Multi-Host Configuration

## Domain Architecture

This application supports multiple subdomains with host-specific routing and restrictions:

### Production Domains

- **admin.bayareacleaningpros.com** - Administrative portal
- **book.bayareacleaningpros.com** - Public booking interface  
- **contractor.bayareacleaningpros.com** - Subcontractor portal
- **portal.bayareacleaningpros.com** - Customer portal (coming soon)
- **try.bayareacleaningpros.com** - Signup redirect (301 to admin)
- **bayareacleaningpros.com** - Marketing site redirect

### DNS Setup Checklist

For each subdomain, configure the following DNS records at your domain registrar:

```
Type: CNAME
Name: admin
Value: [your-lovable-domain].lovable.app

Type: CNAME  
Name: book
Value: [your-lovable-domain].lovable.app

Type: CNAME
Name: contractor
Value: [your-lovable-domain].lovable.app

Type: CNAME
Name: portal
Value: [your-lovable-domain].lovable.app

Type: CNAME
Name: try
Value: [your-lovable-domain].lovable.app

Type: A (for apex domain)
Name: @
Value: 185.158.133.1
```

### SSL Certificates

SSL certificates are automatically provisioned by Lovable for all configured domains. This typically takes 5-15 minutes after DNS propagation.

## Route Restrictions by Host

### Admin Portal (admin.bayareacleaningpros.com)
**Allowed Routes:**
- `/login`, `/signup`, `/onboard`
- `/dashboard`, `/admin/*`
- `/app/*`, `/billing`, `/integrations/*`

**Authentication:** Required (admin/manager roles)

### Booking Portal (book.bayareacleaningpros.com) 
**Allowed Routes:**
- `/` (booking interface)
- `/b/*` (booking slugs)
- Confirmation pages: `/order-confirmation`, `/payment-confirmation`, etc.

**Authentication:** Not required (public)

### Contractor Portal (contractor.bayareacleaningpros.com)
**Allowed Routes:**
- `/today` (daily dashboard)
- `/job/*` (job details)
- `/offer/*` (job offers)
- `/contractor-auth` (login)

**Authentication:** Required (contractor role)

### Customer Portal (portal.bayareacleaningpros.com)
**Allowed Routes:**
- `/portal/*` (customer dashboard)
- `/customer-auth` (login)

**Authentication:** Required (customer role)

## Security Features

### HTTPS Enforcement
- All production hosts automatically redirect HTTP to HTTPS
- Security headers set per host requirements

### Security Headers
```
X-Frame-Options: DENY (SAMEORIGIN for booking portal)
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### SEO Configuration
- Host-specific canonical URLs (no cross-host canonicalization)
- `noindex` directive for admin and contractor portals
- Custom meta descriptions per host

## Health Endpoints

Each host provides a health check endpoint:

- `admin.bayareacleaningpros.com/health/admin`
- `book.bayareacleaningpros.com/health/book` 
- `contractor.bayareacleaningpros.com/health/sub`
- `portal.bayareacleaningpros.com/health/portal`

## Error Handling

### Branded 404 Pages
Each host shows a branded 404 page for unauthorized routes with:
- Host-specific branding and colors
- Appropriate call-to-action buttons
- Consistent styling with Bay Area Cleaning Pros brand

### Cross-Host Protection
Accessing unauthorized routes on any host (e.g., `/admin` on booking portal) shows the branded 404 instead of leaking internal routes.

## Development & Testing

### Local Development
In development environments (localhost, Lovable preview), the system defaults to admin portal with relaxed restrictions for testing.

### Testing Checklist
Once DNS is configured, verify:

1. **Admin Portal:**
   - `https://admin.bayareacleaningpros.com/signup` → Shows signup form
   - Login works and redirects to dashboard
   - Accessing `/app/*` requires authentication

2. **Booking Portal:**  
   - `https://book.bayareacleaningpros.com/` → Shows booking interface
   - Confirmation pages work without authentication
   - Accessing admin routes shows branded 404

3. **Contractor Portal:**
   - `https://contractor.bayareacleaningpros.com/today` → Requires contractor login
   - Job management pages work for authenticated contractors
   - Admin routes show branded 404

4. **Redirects:**
   - `https://try.bayareacleaningpros.com` → 301 redirects to admin signup
   - `https://bayareacleaningpros.com` → Redirects appropriately

5. **Cross-Host Security:**
   - Admin routes on booking portal → Branded 404
   - Contractor routes on admin portal → Branded 404
   - Proper authentication enforcement per host

## Adding New Hosts

To add a new subdomain:

1. **Update Domain Detection** (`src/utils/domainDetection.ts`)
   - Add new host to `hostRoleMap`
   - Define allowed routes and target audience

2. **Configure Security** (`src/components/HostBasedRouter.tsx`)
   - Add authentication rules if needed
   - Set appropriate route restrictions

3. **Add DNS Records**
   - Create CNAME record pointing to Lovable
   - Allow 24-48 hours for propagation

4. **Update Documentation**
   - Add new host to this README
   - Update testing checklist

## Environment Variables

The following environment variables are configured in Lovable:

```
APP_URL=https://admin.bayareacleaningpros.com
BOOK_URL=https://book.bayareacleaningpros.com  
SUB_URL=https://contractor.bayareacleaningpros.com
PORTAL_URL=https://portal.bayareacleaningpros.com
TRY_URL=https://try.bayareacleaningpros.com
ROOT_URL=https://bayareacleaningpros.com
```

These are used for cross-domain redirects and link generation.