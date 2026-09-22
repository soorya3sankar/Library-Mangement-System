# Bookhaven — Library Management System

A small, self-contained library management website built with plain **HTML, CSS
and JavaScript** — no frameworks, no build step, no Bootstrap or jQuery.
Open `index.html` in a browser and it works.

## Pages

| File               | Purpose                                                              |
|---------------------|-----------------------------------------------------------------------|
| `index.html`        | Dashboard — key stats (titles, members, active loans, overdue) and a recent activity feed. |
| `books.html`        | Catalogue — add new titles, search/filter, edit copy counts, remove books. |
| `members.html`      | Members — enrol members, search, see how many books each one currently holds. |
| `issue-return.html` | Issue & Return desk — issue a book to a member, mark books returned, view loan history. |
| `about.html`        | Library info — hours, borrowing rules, contact details. |

All pages share one stylesheet (`style.css`) and one script (`script.js`).

## How data is stored

There's no backend or database. All data — books, members and loan
transactions — is kept in the browser's `localStorage`, under three keys:

- `bh_books`
- `bh_members`
- `bh_transactions`

The first time you open the site, `script.js` seeds a handful of sample
books, members and loans so the dashboard isn't empty. After that, every
change you make (adding a book, issuing a loan, etc.) is saved to
`localStorage` automatically and will still be there the next time you open
the site **in the same browser on the same device**. Clearing browser data
or opening the site in a different browser starts fresh.

## Features

- **Catalogue management** — add books with title, author, ISBN, genre and
  copy count; search by title/author/ISBN; filter by genre; edit copy
  counts; remove titles.
- **Member management** — enrol members with name, email and phone; search
  members; see each member's current loan count; removal is blocked while a
  member still has a book out.
- **Issue & Return** — issue any available book to any member (due date is
  set automatically, 14 days out); mark a loan as returned, which restocks
  the copy; overdue loans are flagged in red; a history table shows the
  most recent returns.
- **Dashboard** — live counts of titles, copies, members, active loans and
  overdue loans, plus a recent-activity feed built from the loan log.

## File structure

```
library-management-system/
├── index.html
├── books.html
├── members.html
├── issue-return.html
├── about.html
├── style.css
├── script.js
└── README.md
```

## Notes for customising

- To change the loan period, edit `LOAN_DAYS` near the top of `script.js`.
- To reset all data back to the sample set, clear `bh_books`, `bh_members`
  and `bh_transactions` from the browser's localStorage (or clear site
  data) and reload.
- Colours, fonts and spacing are all defined as CSS variables at the top of
  `style.css` under `:root`.
