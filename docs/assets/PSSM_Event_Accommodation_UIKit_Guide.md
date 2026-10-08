# UIKit guide
## PSSM Spiritual Event – Accommodation Management System

**Version:** 1.0  
**Last Updated:** 07 October 2026  
**Related documents:**  
- PSSM_Event_Accommodation_UI_Prototype.md  
- PSSM_Event_Accommodation_Technical_Spec.md  

**Source:** [UIkit 3 documentation](https://getuikit.com/docs/introduction), version in use **3.21.13**

This is the working guide for the prototype in `docs/prototype/` and for the real pages later in `src/frontend/`. It follows the left-hand **Documentation** menu on the UIkit site: Getting started, then Components. Use a component from that menu. Do not invent a second visual system.

The prototype loads UIkit from the CDN named in the [installation](https://getuikit.com/docs/installation) page. The real app can keep that until `src/frontend/` exists, then install the same version with the package manager and bundle it. Do not upgrade UIkit casually. Stay on 3.21.13 until a change is tested on the visitor wizard and one admin list.

---

## 1. How every page is built

The [introduction](https://getuikit.com/docs/introduction) asks for three files: the CSS, the JavaScript, and the icon library. Pages that only show buttons and inputs can load the CSS. Pages that use icons, the switcher, a modal, a grid, or a sticky block also load the JavaScript. Icons need `uikit-icons.min.js`.

Shared look lives in `docs/prototype/app.css`. It keeps the header at 72 pixels, the ink and gold colours, the phone column and the laptop layout, and a few control sizes. New screens link that file. They do not copy the header CSS into the page.

Every visitor, admin, and receptionist screen follows the same shape:

- One job on the screen. A phone should see the title, the fields for that step, and one primary button.
- Below 960 pixels the column stays narrow (`app-column`, about 440 pixels) and the primary button is full width. From 960 pixels up, the same pages use a laptop layout: a wider column, paired fields, and a button that sizes to its label.
- Labels sit above the fields (`uk-form-stacked`).
- On a phone the primary button is full width (`uk-button uk-button-primary uk-width-1-1`).
- Help text is one short line, or it is left out.
- Back sits beside the step line in the body above the form card, not in the header and not under Continue.

---

## 2. Getting started

These are the items under **Getting started** in the documentation menu. Use the row. Skip the rest until the real app needs it.

| Page | Use it for | Leave it until later |
| --- | --- | --- |
| [Introduction](https://getuikit.com/docs/introduction) | The three files to include, and the rule that pages are normal HTML plus `uk-` classes | |
| [Installation](https://getuikit.com/docs/installation) | CDN links for the prototype. Same version number on every page | `pnpm add uikit` when `src/frontend/` starts |
| Less, Sass | | A compiled theme. Colour changes stay in `app.css` for now |
| [JavaScript](https://getuikit.com/docs/javascript) | Components that need behaviour: `uk-switcher`, `uk-modal`, `uk-grid`, `uk-icon`. Call `UIkit.switcher(...)` or `UIkit.modal(...)` when the page must open a step or a popup from code | |
| Webpack | | Bundling the real app. The prototype stays as plain HTML files |
| Custom icons | | Only after the built-in icon set has no suitable icon |
| [Avoiding conflicts](https://getuikit.com/docs/avoiding-conflicts) | Keep our classes (`.app-header`, `.choice`, `.step-actions`) separate from `uk-` classes. Do not restyle `button` or `input` without the `uk-` class | |
| [Accessibility](https://getuikit.com/docs/accessibility) | A real `<label>` for every field, `type="button"` on buttons that must not submit, and text plus colour for status. The progress bar has an accessible name | |
| RTL support | | This app is English, left to right |
| Migration | | We are on UIkit 3. Do not copy UIkit 2 class names |

JavaScript detail that matters: UIkit starts components that are in the HTML when the page loads. Markup added later (a new family member, a new day row) needs the component attribute in the new markup. If a grid or icon in that new markup does not appear, call `UIkit.update(element)` on the new piece.

---

## 3. Components already in the prototype

| Component | Where | When to use it | What to use | Detail |
| --- | --- | --- | --- | --- |
| [Section](https://getuikit.com/docs/section), [Container](https://getuikit.com/docs/container), [Padding](https://getuikit.com/docs/padding) | Landing, wizard, login | The page background and the column under the header | `uk-section uk-section-small`, `uk-container`, `app-column` | Phone: about 440 pixels. Laptop (960 pixels and up): about 1040, or `app-narrow` (560) for login |
| [Card](https://getuikit.com/docs/card) | Landing actions, each wizard step, login | A white sheet of one task, or a tappable row on the home screen | `uk-card uk-card-default uk-card-small uk-card-body`. Home rows add `uk-card-hover` and `uk-link-reset` | One card per step. Do not nest a card inside a card. A family member uses `uk-background-muted`, not a second card |
| [Button](https://getuikit.com/docs/button) | Continue, choices, home rows | The one action that moves forward, or a choice the person taps | `uk-button-primary` for Continue, Review, Login, and the selected plan. `uk-button-default` for the other plan and for Add. `uk-button-text` for a quiet back link | One primary button on a step. `type="button"` unless the control really submits a form |
| [Icon](https://getuikit.com/docs/icon) | Home rows, back, selected plan | A small cue beside a label. Not decoration on every field | `uk-icon="icon: plus"`, `sign-in`, `chevron-right`, `chevron-left`, `check` | Needs the icon script. `ratio: 0.9` when the icon sits inside a button |
| [Flex](https://getuikit.com/docs/flex), [Width](https://getuikit.com/docs/width), [Grid](https://getuikit.com/docs/grid) | Home rows, date and month, state and country, photos, day steppers | Two short fields side by side, or an icon plus a label plus a chevron | `uk-grid-small uk-child-width-1-2` with the `uk-grid` attribute. Home actions add `uk-child-width-1-2@m`. `uk-flex uk-flex-middle` for a row of icon and text | Needs the JavaScript for `uk-grid`. On a phone, two columns only when both values are short. From 960 pixels, `desk-fields` pairs name with mobile, village with town, and the two ID lists |
| [Form](https://getuikit.com/docs/form) | Login, who is coming, place, family, ID | Anything the person types or picks from a long list | `uk-form-stacked`, `uk-form-label`, `uk-input`, `uk-select`, `uk-form-small` | `app.css` makes `uk-form-small` 42 pixels tall and 16 pixels in type so a phone does not zoom in. Date of birth is two text fields with `inputmode="numeric"`, not `type="date"`, because a date picker asks for a year and this app does not |
| [Subnav](https://getuikit.com/docs/subnav) | Gender, rural or urban, meditation, yes or no | Two to about eight choices the person can see at once | `uk-subnav uk-subnav-pill`, plus `choice` for a two-way control | Faster than a dropdown. The selected item is `uk-active`. Meditation on the visitor step is one row (`med-choice` inside `med-fit`). On a family member, `can-wrap` may use a second line |
| [Switcher](https://getuikit.com/docs/switcher) | The visitor wizard | One step visible at a time, with no tab strip | A hidden `uk-switcher` nav connected to `ul.uk-switcher`. `swiping: false` | The first step has `uk-active`, or the CSS hides every step. The nav stays `uk-hidden`. The visible “Step 2 of 7” line is our own text. Do not show the switcher tabs. Swiping is off so a sideways touch does not skip a step while someone is filling a field |
| [Progress](https://getuikit.com/docs/progress) | Wizard | How far through the steps, in one glance | `<progress class="uk-progress">` and a step line in the body | The step line and a 3-pixel progress bar sit above the form card. They read “Step 2 of 7 · Who is coming?”. Update `value`, `max`, and that line when the route changes (the couple step appears only for one male and one female) |
| [Modal](https://getuikit.com/docs/modal) | Family address | A side task that uses the same fields as another step, then returns | `uk-modal` with `uk-modal-dialog uk-modal-body` | Address is a popup. It is not a wizard step. Open it from Different address. Cancel returns to Same as my address if nothing was saved |
| [Placeholder](https://getuikit.com/docs/placeholder) | ID photos | An empty photo box with one button | `uk-placeholder uk-text-center` | The button says Take photo. This is the camera box, not a file picker |
| [Description list](https://getuikit.com/docs/description-list), [Label](https://getuikit.com/docs/label) | Summary | Read-only receipt | `uk-description-list uk-description-list-divider`. Status is `uk-label` | No new typing on that step |
| [Heading](https://getuikit.com/docs/heading), [Text](https://getuikit.com/docs/text) | Titles and hints | The step title and the one-line hint | `uk-h4` for the step title. `uk-text-meta` for a hint. `uk-text-bold` for a home-row title | Do not add a second paragraph of instructions |
| [Visibility](https://getuikit.com/docs/visibility) | Back button on step 1, rural or urban fields, switcher nav | Hide a block until a choice is made | The `hidden` attribute for fields. `uk-hidden` for the wizard tab list. `uk-invisible` to reserve the back-button width so the step title stays centred | `hidden` removes the fields. `uk-invisible` keeps the space |
| [Margin](https://getuikit.com/docs/margin) | Space between fields | Tight stacks | `uk-margin-small` between fields. `uk-margin-remove-top` on the step title | Avoid `uk-margin-large`. The page should feel like an app, not an article |
| [Background](https://getuikit.com/docs/background), [Box shadow](https://getuikit.com/docs/inverse) | Page and step card | Separate the sheet from the page | Page background is `--paper` in `app.css`. The step card uses `uk-box-shadow-medium`. Family blocks use `uk-background-muted` | The header stays white with the gold line. Do not put a coloured band behind the form |

The header stays a custom `.app-header` at 72 pixels. Inside it, use a slim [Navbar](https://getuikit.com/docs/navbar) for the three top links (`Stay`, `Account`, `Help`) with `uk-navbar="mode: click"` and `uk-navbar-dropdown`. Do not replace the whole bar with `uk-navbar-container`. On a phone, hide that row and use one menu button with [Dropdown](https://getuikit.com/docs/dropdown). Use the [Sticky](https://getuikit.com/docs/sticky) component later only if some other block, such as a filter row on a long admin list, must stick while the rest scrolls.

---

## 4. What to reach for next

These screens are specified in the UI prototype and are not built yet. Pick from this table before adding a new pattern.

| Screen | Reach for | Do not reach for |
| --- | --- | --- |
| Landing | Card rows with an icon and a chevron, as on `index.html` | A tab bar, a navbar of links, or more than two actions |
| Login | Stacked form, grid for date and month, primary button | A password field. The page builds the password from the event code, the name, and the date and month |
| Visitor wizard | Switcher, progress, subnav pills, form, modal for address | Visible tabs, accordion sections, or more than one step on the page |
| Admin event and hotel form | The same stacked form as the visitor. A reserved hotel is a [subnav](https://getuikit.com/docs/subnav) pill or two buttons, not a separate settings page | A settings area with many switches on one screen |
| Hotel list, bookings waiting, guest list, checkout reminders | [Table](https://getuikit.com/docs/table): `uk-table uk-table-small uk-table-divider uk-table-responsive` | A table with every column. Extra detail opens on the next step. On a phone, `uk-table-responsive` scrolls sideways rather than crushing the columns |
| Filter chips (All, Waiting, Sevadal, Self booked) | Subnav pills in one row | A sidebar of filters |
| Run allocation, review overrides | One primary button, then a table. Override hotel and room are `uk-select` | Editing the proposal inside a modal for every row |
| Unmatched parties | The same table, or a second card under it, with a short empty state | A blank page. Use [Placeholder](https://getuikit.com/docs/placeholder) when the list is empty: “No parties are waiting.” |
| Status (Waiting, Allotted, Expected, Checked in) | [Label](https://getuikit.com/docs/label) | Colour alone |
| Counts (persons, rooms left) | [Badge](https://getuikit.com/docs/badge) next to a title, when a count helps. Skip it when the title already says “3 persons” | |
| Save succeeded, check-in confirmed | [Notification](https://getuikit.com/docs/notification): one short toast, then it goes away | A new page that only says Saved |
| Something is wrong with what they typed | One line under the field, as birth date does now. Use [Alert](https://getuikit.com/docs/alert) `uk-alert-danger` only when the whole step cannot continue and a line under one field is not enough | A modal for a validation message |
| Receptionist finds a guest | [Search](https://getuikit.com/docs/search) `uk-search uk-search-default`, full width, then the result card | A long filter form |
| ID photos on check-in | The same placeholder boxes. [Lightbox](https://getuikit.com/docs/lightbox) only if they need a larger view of a photo already taken | The [Upload](https://getuikit.com/docs/upload) drop zone. Identity photos are from the camera, not a file |
| Printable party card | [Print](https://getuikit.com/docs/print) so the on-screen buttons hide when the card is printed | A separate design tool |
| Admin menu on a phone, once there are several tasks | [Off-canvas](https://getuikit.com/docs/offcanvas) with [Nav](https://getuikit.com/docs/nav) | A permanent side menu that squeezes the form |
| A block that must stay visible on a long list | [Sticky](https://getuikit.com/docs/sticky) | Sticking the whole form |

---

## 5. Leave these alone

They are in the same Documentation menu. They do not help this app.

| Component | Why it stays unused |
| --- | --- |
| Accordion | Hides fields. A wizard step is short enough to show its fields |
| Tab | Peer panels on one page. We already use a hidden switcher so the person sees one step |
| Dropnav, Drop, Dropbar | Prefer navbar dropdowns in the header, or pills and selects in forms. Dropbar takes too much vertical space |
| Slideshow, Slider, Lightbox (except a larger ID photo), Parallax, Cover, Video | Marketing layout. This is a form |
| Countdown, Totop, Marker, Leader, Comment, Article, Divider as decoration | Not part of booking, allocation, or the front desk |
| Sortable | Staff do not drag rows to allocate. Allocation is a button, then a table |
| Upload | The visitor does not drop a file for the ID |
| Icon nav, Thumb nav, Dot nav | Picture galleries and carousels |
| Tooltip | Extra text on hover. Phones have no hover. Put the one line of help under the field or leave it out |

---

## 6. Choices that keep coming up

**Two or three options** (Male / Female, Rural / Urban, Yes / No, Free / Paid). Subnav pills. Show every option. Do not use a select.

**More than a few options** (ID proof type, override hotel, override room). `uk-select`. A row of pills will wrap into a tall block.

**A number they change by one** (days of stay). A minus button, the number, and a plus button, in a three-column grid. Minimum 1.

**A date we own** (day and month of birth, with no year). Two numeric text fields. Check the month is 1–12 and the day is valid for that month. February allows 29.

**A date the calendar owns** (event start, event end, booking closes). `type="date"` on `uk-input` is acceptable there, because a year is required. Booking closes is read-only: start date minus 2 days. The visitor never types check-in or check-out. Those are shown as 11:00 AM.

**Yes that reveals one more field.** Keep the pills. Show the extra input only after Yes. Do not open a modal for one line of text.

**The same fields again for one person** (family member, hotel room row). A repeated muted block and a full-width Add button. Remove is `uk-button-text`.

**A task that borrows another step’s fields** (family address uses the place step). Modal. Default the choice to the visitor’s address. The second button opens the popup.

**A list.** Table, few columns, label for status. The row’s next step holds the detail.

**Empty, loading, failed.** Placeholder for empty. [Spinner](https://getuikit.com/docs/spinner) inside the button or under the title while a save runs, in the real app. Alert or a line under the field when it fails. The prototype does not call the server, so it does not need a spinner yet.

---

## 7. Details that are easy to get wrong

- Load `uikit.min.js` before any script that calls `UIkit.switcher` or `UIkit.modal`. Load `uikit-icons.min.js` after it when the page uses `uk-icon`.
- The switcher’s content CSS hides every item that is not `uk-active`. Put `uk-active` on the first nav item and the first panel so the first step is visible before the script runs.
- `uk-switcher` with `swiping: false` on a form. Leave swiping on only for a gallery.
- `uk-grid` is both a class and an attribute. The attribute is what sets the gaps. Dynamic rows need the attribute too.
- Do not put a form inside a form. The place step’s rural block and urban block are separate forms. The modal is outside the wizard form.
- Primary colour in `app.css` is ink `#1b2a6b`, not the default UIkit blue. New buttons pick up that colour if they use `uk-button-primary`.
- The header is 72 pixels, with no vertical padding. Do not add navbar classes, a second toolbar, or a larger logo. The PSSM logo is `object-fit: contain`. The three pictures on the right are `object-fit: cover`.
- Status is a word in a label, not only a colour. Waiting, Allotted, and Checked in must stay readable in grey.
- Icons are optional. A field does not need an icon to look finished.
- Alpine.js, named in the technical spec, will hold the real step state later. UIkit still draws the controls. Do not rebuild pills, modals, or the grid in Alpine.

---

## 8. File map

| File | Role |
| --- | --- |
| `docs/prototype/app.css` | Header, colours, narrow column, button and field shape |
| `docs/prototype/index.html` | Landing. Two card rows |
| `docs/prototype/login.html` | Login to My space |
| `docs/prototype/visitor.html` | Registration wizard |
| `docs/assets/PSSM_Event_Accommodation_UI_Prototype.md` | Fields and steps |
| `src/frontend/` | Real app, later. Same components, same `app.css` rules |

When a new prototype page is added, copy the header from `index.html`, link `app.css` and the UIkit 3.21.13 files, and choose components from section 4 of this guide.
