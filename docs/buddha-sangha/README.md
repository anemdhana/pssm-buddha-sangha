# PSSM Buddha Sangha

Primary docs for this project (`pssm-buddha-sangha`). Event accommodation is a related module under `docs/requirements/`, `docs/technical/`, and the shared prototype.

## Prototype entry

| Page | Path |
| --- | --- |
| Sangha landing (site home) | `docs/prototype/index.html` |
| Join (visitor + family) | `docs/prototype/join.html` |
| Accommodation (prefills from join) | `docs/prototype/visitor.html` |
| Login to My Space | `docs/prototype/login.html` |

Join stores a sangha profile in the browser (`localStorage`). Accommodation opens a **copy** of that profile. Edits on the accommodation form do not change the sangha join record.

## Login password (prototype)

The first five letters of the name (letters only) plus date and month of birth, with event code `DMY5` in front when used with accommodation login.

## Specs in this folder

- `requirements/PSSM_Buddha_Sangha_Requirements.md`
- `requirements/PSSM_Buddha_Sangha_User_Stories.md`
- `technical/PSSM_Buddha_Sangha_Technical_Spec.md`
- `technical/PSSM_Buddha_Sangha_Register_Summary.md`
- `assets/PSSM_Buddha_Sangha_UI_Prototype.md`
