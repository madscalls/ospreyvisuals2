// GET /api/admin/session: who is signed in (the admin page shows it in the header).
import { json } from '../../_lib/http.js';

export const onRequestGet = ({ data }) => json({ email: data.admin });
