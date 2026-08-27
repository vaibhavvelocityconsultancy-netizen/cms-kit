# CMSKit

Local development package for the CMSKit project generator.

## Test it

```bash
npm install
npm link
```

Then from another directory:

```bash
create-cmskit my-site
```

The current phase:
- copies the real CMS template
- asks for project name
- asks for database
- asks for modules
- asks whether to create default content
- creates `.env`
- creates `cmskit.config.json`

The current CMS Prisma schema is MySQL-based and contains Prisma features that cannot simply be switched to SQLite. CMSKit therefore refuses the SQLite choice for now instead of generating a broken project. The next phase should implement a proper database adapter/schema transformation before enabling SQLite.
