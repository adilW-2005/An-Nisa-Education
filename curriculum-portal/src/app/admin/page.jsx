"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import fallbackData from "../../../data/curricula.json";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;
const DRIVE_FILE_ID = process.env.NEXT_PUBLIC_CURRICULA_DRIVE_FILE_ID;
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const MANIFEST_NAME = "curricula.json";
const DRIVE_SCOPE = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");
const ACCESS_TOKEN_STORAGE_KEY = "curriculumAdmin.googleAccessToken";
const ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY = "curriculumAdmin.googleAccessTokenExpiresAt";
const ADMIN_USER_STORAGE_KEY = "curriculumAdmin.googleUser";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugify(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.id = id;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function getFileUrl(file) {
  if (file.url) return file.url;
  if (file.mimeType === "application/vnd.google-apps.document") {
    return `https://docs.google.com/document/d/${file.id}/edit`;
  }
  if (file.mimeType === "application/vnd.google-apps.presentation") {
    return `https://docs.google.com/presentation/d/${file.id}/edit`;
  }
  return `https://drive.google.com/file/d/${file.id}/view`;
}

function getLinkLabel(url) {
  if (!url) return "";
  if (url.includes("/document/d/")) return "Google Doc";
  if (url.includes("/presentation/d/")) return "Google Slides";
  if (url.includes("/spreadsheets/d/")) return "Google Sheet";
  if (url.includes("drive.google.com")) return "Drive file";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Linked";
  }
}

function getStoredAccessToken() {
  if (typeof window === "undefined") return "";
  const token = window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  const expiresAt = Number(
    window.sessionStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY)
  );
  if (!token || !expiresAt || Date.now() >= expiresAt) {
    clearStoredAccessToken();
    return "";
  }
  return token;
}

function storeAccessToken(token, expiresInSeconds) {
  if (typeof window === "undefined") return;
  // Leave a small buffer so we do not reuse a token right as Google expires it.
  const ttl = Math.max(0, (Number(expiresInSeconds) || 3600) - 60);
  window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  window.sessionStorage.setItem(
    ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY,
    String(Date.now() + ttl * 1000)
  );
}

function clearStoredAccessToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY);
  window.sessionStorage.removeItem(ADMIN_USER_STORAGE_KEY);
}

function getStoredAdminUser() {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(ADMIN_USER_STORAGE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    window.sessionStorage.removeItem(ADMIN_USER_STORAGE_KEY);
    return null;
  }
}

function storeAdminUser(user) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(user));
}

function isAllowedAdmin(user) {
  if (!user?.email) return false;
  if (ADMIN_EMAILS.length === 0) return true;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export default function AdminPage() {
  const [data, setData] = useState(() => clone(fallbackData));
  const savedSnapshotRef = useRef(JSON.stringify(fallbackData));

  const [accessToken, setAccessToken] = useState("");
  const [adminUser, setAdminUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [manifestFile, setManifestFile] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [driveMenuOpen, setDriveMenuOpen] = useState(false);

  const [curIdx, setCurIdx] = useState(null);
  const [compIdx, setCompIdx] = useState(null);

  // editorState describes which modal (if any) is open and its working draft.
  const [editor, setEditor] = useState(null);

  const googleReady = Boolean(CLIENT_ID && API_KEY);
  const curricula = data.curricula || [];
  const curriculum = curIdx != null ? curricula[curIdx] : null;
  const competency =
    curriculum && compIdx != null ? curriculum.competencies?.[compIdx] : null;

  const currentSerialized = useMemo(() => JSON.stringify(data), [data]);
  const isDirty = currentSerialized !== savedSnapshotRef.current;
  const isSignedInAdmin = Boolean(adminUser);

  useEffect(() => {
    if (!toast) return;
    if (toast.kind === "error") return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    async function restoreAdminSession() {
      const storedToken = getStoredAccessToken();
      const storedUser = getStoredAdminUser();

      if (storedToken && storedUser && isAllowedAdmin(storedUser)) {
        setAccessToken(storedToken);
        setAdminUser(storedUser);
        if (DRIVE_FILE_ID) {
          try {
            await loadManifestWithToken(
              { id: DRIVE_FILE_ID, name: MANIFEST_NAME },
              storedToken
            );
          } catch (error) {
            clearStoredAccessToken();
            setAccessToken("");
            setAdminUser(null);
            setToast({
              kind: "info",
              message: "Your Google session expired. Sign in again to edit.",
            });
            console.warn("Stored Google session could not be reused:", error);
          }
        }
      } else if (storedToken || storedUser) {
        clearStoredAccessToken();
      }

      if (!DRIVE_FILE_ID) {
        setToast({
          kind: "info",
          message:
            "Sign in with Google to create or open a Drive manifest.",
        });
      }

      setAuthChecked(true);
    }

    restoreAdminSession();
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setEditor(null);
        setDriveMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- Google Drive plumbing ----

  async function loadGoogle() {
    if (!googleReady) {
      throw new Error(
        "Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID or NEXT_PUBLIC_GOOGLE_API_KEY."
      );
    }
    await Promise.all([
      loadScript("https://accounts.google.com/gsi/client", "google-identity-services"),
      loadScript("https://apis.google.com/js/api.js", "google-api-loader"),
    ]);
    await new Promise((resolve) => window.gapi.load("picker", resolve));
  }

  async function requestAccessToken(prompt = "") {
    if (accessToken) return accessToken;
    const storedToken = getStoredAccessToken();
    if (storedToken) {
      setAccessToken(storedToken);
      return storedToken;
    }
    await loadGoogle();
    const tokenResponse = await new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          resolve(response);
        },
      });
      client.requestAccessToken({ prompt });
    });
    const token = tokenResponse.access_token;
    storeAccessToken(token, tokenResponse.expires_in);
    setAccessToken(token);
    return token;
  }

  async function getGoogleUser(token) {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      clearStoredAccessToken();
      throw new Error("Could not verify your Google account.");
    }
    const user = await response.json();
    if (!isAllowedAdmin(user)) {
      clearStoredAccessToken();
      throw new Error(
        ADMIN_EMAILS.length
          ? `${user.email} is not listed as an admin.`
          : "This Google account could not be verified."
      );
    }
    storeAdminUser(user);
    setAdminUser(user);
    return user;
  }

  async function requireAdminToken(prompt = "") {
    const token = await requestAccessToken(prompt);
    if (!adminUser) {
      await getGoogleUser(token);
    }
    return token;
  }

  async function withBusy(label, fn) {
    setIsBusy(true);
    try {
      await fn();
    } catch (error) {
      setToast({ kind: "error", message: error.message || `Could not ${label}.` });
    } finally {
      setIsBusy(false);
    }
  }

  async function connectGoogle() {
    await withBusy("connect to Google", async () => {
      const token = await requestAccessToken("consent");
      const user = await getGoogleUser(token);
      setToast({
        kind: "success",
        message: `Signed in as ${user.email}.`,
      });
      if (DRIVE_FILE_ID && !manifestFile) {
        await loadManifestWithToken(
          { id: DRIVE_FILE_ID, name: MANIFEST_NAME },
          token
        );
      }
    });
  }

  async function loadManifestWithToken(file, token) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearStoredAccessToken();
        setAccessToken("");
        setAdminUser(null);
        throw new Error("Google session expired. Connect Google again.");
      }
      const text = await response.text();
      throw new Error(text || `Could not read the manifest (HTTP ${response.status}).`);
    }
    const json = await response.json();
    setData(json);
    savedSnapshotRef.current = JSON.stringify(json);
    setManifestFile(file);
    setToast({
      kind: "success",
      message: `Loaded ${file.name || MANIFEST_NAME} from Drive.`,
    });
  }

  function signOutAdmin() {
    if (isDirty && !window.confirm("Sign out and discard unsaved local edits?")) {
      return;
    }
    clearStoredAccessToken();
    setAccessToken("");
    setAdminUser(null);
    setManifestFile(null);
    setData(clone(fallbackData));
    savedSnapshotRef.current = JSON.stringify(fallbackData);
    setCurIdx(null);
    setCompIdx(null);
    setEditor(null);
    setToast({ kind: "info", message: "Signed out of the admin editor." });
  }

  async function driveGet(path) {
    const token = await requireAdminToken("consent");
    const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }

  async function findManifest() {
    await withBusy("find manifest", async () => {
      const result = await driveGet(
        `files?q=${encodeURIComponent(
          `name='${MANIFEST_NAME}' and trashed=false`
        )}&fields=files(id,name,webViewLink,modifiedTime)&orderBy=modifiedTime desc`
      );
      const file = result.files?.[0];
      if (!file) {
        setToast({
          kind: "info",
          message: `No ${MANIFEST_NAME} found in this app's Drive files.`,
        });
        return;
      }
      await loadManifest(file);
    });
  }

  async function loadManifest(file) {
    await withBusy("load manifest", async () => {
      const token = await requireAdminToken("consent");
      await loadManifestWithToken(file, token);
    });
  }

  async function createManifest() {
    await withBusy("create manifest", async () => {
      const token = await requireAdminToken("consent");
      const boundary = "curriculum_manifest_boundary";
      const metadata = { name: MANIFEST_NAME, mimeType: "application/json" };
      const body = [
        `--${boundary}`,
        "Content-Type: application/json; charset=UTF-8",
        "",
        JSON.stringify(metadata),
        `--${boundary}`,
        "Content-Type: application/json",
        "",
        JSON.stringify(data, null, 2),
        `--${boundary}--`,
      ].join("\r\n");

      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body,
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const file = await response.json();
      await publishManifestForPublicSite(file.id, token);
      setManifestFile(file);
      savedSnapshotRef.current = JSON.stringify(data);
      setToast({
        kind: "success",
        message: `Created and published ${MANIFEST_NAME}. File ID: ${file.id}`,
      });
    });
  }

  async function publishManifestForPublicSite(fileId, token) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      }
    );

    // Google returns 409 if the permission already exists. That is fine.
    if (!response.ok && response.status !== 409) {
      const text = await response.text();
      throw new Error(
        text || "Saved, but could not publish the manifest for the public site."
      );
    }
  }

  async function saveManifest() {
    const fileId = manifestFile?.id || DRIVE_FILE_ID;
    if (!fileId) {
      setToast({
        kind: "error",
        message: "Create or open a Drive manifest before saving.",
      });
      return;
    }
    await withBusy("save manifest", async () => {
      const token = await requireAdminToken("consent");
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data, null, 2),
        }
      );
      if (!response.ok) throw new Error(await response.text());
      await publishManifestForPublicSite(fileId, token);
      savedSnapshotRef.current = JSON.stringify(data);
      setToast({
        kind: "success",
        message: "Saved to Google Drive and published to the website.",
      });
    });
  }

  function discardChanges() {
    if (
      !window.confirm(
        "Discard your unsaved edits and reload the last saved version?"
      )
    ) {
      return;
    }
    const restored = JSON.parse(savedSnapshotRef.current);
    setData(restored);
    setToast({ kind: "info", message: "Discarded local changes." });
  }

  async function openManifestPicker() {
    await withBusy("open manifest picker", async () => {
      const token = await requireAdminToken("consent");
      await loadGoogle();
      const view = new window.google.picker.DocsView()
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);

      const builder = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setCallback((d) => {
          if (d.action !== window.google.picker.Action.PICKED) return;
          const doc = d.docs?.[0];
          if (!doc) return;
          loadManifest({ id: doc.id, name: doc.name, webViewLink: doc.url });
        });
      if (APP_ID) builder.setAppId(APP_ID);
      builder.build().setVisible(true);
    });
  }

  async function pickGoogleFile(onPick) {
    try {
      const token = await requireAdminToken("consent");
      await loadGoogle();
      const view = new window.google.picker.DocsView()
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);

      const builder = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setCallback((d) => {
          if (d.action !== window.google.picker.Action.PICKED) return;
          const file = d.docs?.[0];
          if (!file) return;
          onPick({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            url: getFileUrl(file),
          });
        });
      if (APP_ID) builder.setAppId(APP_ID);
      builder.build().setVisible(true);
    } catch (error) {
      setToast({ kind: "error", message: error.message || "Could not open Drive picker." });
    }
  }

  // ---- mutators ----

  function patch(updater) {
    setData((current) => {
      const next = clone(current);
      updater(next);
      return next;
    });
  }

  function removeCurriculum(i) {
    const target = curricula[i];
    if (!window.confirm(`Delete curriculum "${target?.title || ""}"?`)) return;
    patch((next) => next.curricula.splice(i, 1));
    if (curIdx === i) {
      setCurIdx(null);
      setCompIdx(null);
    }
  }

  function removeCompetency(i, j) {
    const target = curricula[i]?.competencies?.[j];
    if (!window.confirm(`Delete competency "${target?.title || ""}"?`)) return;
    patch((next) => next.curricula[i].competencies.splice(j, 1));
    if (curIdx === i && compIdx === j) setCompIdx(null);
  }

  // A curriculum is either Competency -> Lessons (K-2, 3-5) or a flat
  // developmental Lesson sequence (6-8: curriculum.lessons directly, no
  // competencies). `j == null` means "the curriculum's own lessons[]";
  // otherwise `j` is a competency index. See README "Data model".
  function lessonContainer(i, j) {
    return j == null ? curricula[i] : curricula[i]?.competencies?.[j];
  }

  function removeLesson(i, j, k) {
    const target = lessonContainer(i, j)?.lessons?.[k];
    if (!window.confirm(`Delete lesson "${target?.title || ""}"?`)) return;
    patch((next) => {
      const c = j == null ? next.curricula[i] : next.curricula[i].competencies[j];
      c.lessons.splice(k, 1);
    });
  }

  function removeExtra(i, j, k, l) {
    patch((next) => {
      const c = j == null ? next.curricula[i] : next.curricula[i].competencies[j];
      c.lessons[k].extras.splice(l, 1);
    });
  }

  function removeCurriculumExtra(i, l) {
    patch((next) => next.curricula[i].extras.splice(l, 1));
  }

  // ---- editor (modal) ----

  function openAddCurriculum() {
    setEditor({
      mode: "create",
      kind: "curriculum",
      draft: {
        title: "",
        id: "",
        masterPlan: "",
        scenarioCards: "",
        gradeLabel: "",
        tagline: "",
        lessonSequence: false,
      },
    });
  }

  function openEditCurriculum(i) {
    const c = curricula[i];
    setEditor({
      mode: "edit",
      kind: "curriculum",
      indices: { i },
      draft: {
        title: c.title || "",
        id: c.id || "",
        masterPlan: c.masterPlan || "",
        scenarioCards: c.scenarioCards || "",
        gradeLabel: c.gradeLabel || "",
        tagline: c.tagline || "",
        lessonSequence: Array.isArray(c.lessons),
      },
    });
  }

  function openAddCompetency(i) {
    setEditor({
      mode: "create",
      kind: "competency",
      indices: { i },
      draft: {
        title: "",
        id: "",
        summary: "",
        parentLetter: "",
        materialsList: "",
      },
    });
  }

  function openEditCompetency(i, j) {
    const c = curricula[i].competencies[j];
    setEditor({
      mode: "edit",
      kind: "competency",
      indices: { i, j },
      draft: {
        title: c.title || "",
        id: c.id || "",
        summary: c.summary || "",
        parentLetter: c.parentLetter || "",
        materialsList: c.materialsList || "",
      },
    });
  }

  function openAddLesson(i, j) {
    const nextNumber = (lessonContainer(i, j)?.lessons || []).length + 1;
    setEditor({
      mode: "create",
      kind: "lesson",
      indices: { i, j },
      draft: {
        title: "",
        number: nextNumber,
        docUrl: "",
        slidesUrl: "",
        coreSkill: "",
        duration: "",
        primaryCompetencies: "",
        secondaryCompetencies: "",
      },
    });
  }

  function openEditLesson(i, j, k) {
    const l = lessonContainer(i, j).lessons[k];
    setEditor({
      mode: "edit",
      kind: "lesson",
      indices: { i, j, k },
      draft: {
        title: l.title || "",
        number: l.number ?? k + 1,
        docUrl: l.docUrl || "",
        slidesUrl: l.slidesUrl || "",
        coreSkill: l.coreSkill || "",
        duration: l.duration || "",
        primaryCompetencies: (l.primaryCompetencies || []).join(", "),
        secondaryCompetencies: (l.secondaryCompetencies || []).join(", "),
      },
    });
  }

  function openAddExtra(i, j, k) {
    setEditor({
      mode: "create",
      kind: "extra",
      scope: "lesson",
      indices: { i, j, k },
      draft: { label: "", url: "" },
    });
  }

  function openAddCurriculumExtra(i) {
    setEditor({
      mode: "create",
      kind: "extra",
      scope: "curriculum",
      indices: { i },
      draft: { label: "", url: "" },
    });
  }

  function commitEditor() {
    if (!editor) return;
    const d = editor.draft;
    const indices = editor.indices || {};

    if (editor.kind === "curriculum") {
      const title = d.title.trim();
      if (!title) return setToast({ kind: "error", message: "Title is required." });
      const id = slugify(d.id || title);
      patch((next) => {
        if (editor.mode === "create") {
          const base = {
            id,
            title,
            masterPlan: d.masterPlan.trim(),
            scenarioCards: d.scenarioCards.trim(),
          };
          if (d.gradeLabel.trim()) base.gradeLabel = d.gradeLabel.trim();
          if (d.tagline.trim()) base.tagline = d.tagline.trim();
          if (d.lessonSequence) {
            base.lessons = [];
            base.extras = [];
          } else {
            base.competencies = [];
          }
          next.curricula.push(base);
        } else {
          const c = next.curricula[indices.i];
          c.id = id;
          c.title = title;
          c.masterPlan = d.masterPlan.trim();
          c.scenarioCards = d.scenarioCards.trim();
          c.gradeLabel = d.gradeLabel.trim();
          c.tagline = d.tagline.trim();
        }
      });
    } else if (editor.kind === "competency") {
      const title = d.title.trim();
      if (!title) return setToast({ kind: "error", message: "Title is required." });
      const cur = curricula[indices.i];
      const fallbackId = `competency-${(cur.competencies?.length || 0) + 1}`;
      const id = slugify(d.id || fallbackId);
      patch((next) => {
        const c = next.curricula[indices.i];
        if (editor.mode === "create") {
          c.competencies = c.competencies || [];
          c.competencies.push({
            id,
            title,
            summary: d.summary.trim(),
            parentLetter: d.parentLetter.trim(),
            materialsList: d.materialsList.trim(),
            lessons: [],
          });
        } else {
          const comp = c.competencies[indices.j];
          comp.id = id;
          comp.title = title;
          comp.summary = d.summary.trim();
          comp.parentLetter = d.parentLetter.trim();
          comp.materialsList = d.materialsList.trim();
        }
      });
    } else if (editor.kind === "lesson") {
      const title = d.title.trim();
      if (!title) return setToast({ kind: "error", message: "Title is required." });
      const number = Number(d.number) || 0;
      const splitList = (v) =>
        (v || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      patch((next) => {
        const c =
          indices.j == null
            ? next.curricula[indices.i]
            : next.curricula[indices.i].competencies[indices.j];
        if (editor.mode === "create") {
          c.lessons = c.lessons || [];
          c.lessons.push({
            number: number || c.lessons.length + 1,
            title,
            coreSkill: d.coreSkill.trim(),
            duration: d.duration.trim(),
            primaryCompetencies: splitList(d.primaryCompetencies),
            secondaryCompetencies: splitList(d.secondaryCompetencies),
            docUrl: d.docUrl.trim(),
            slidesUrl: d.slidesUrl.trim(),
            extras: [],
          });
        } else {
          const l = c.lessons[indices.k];
          l.number = number || l.number;
          l.title = title;
          l.coreSkill = d.coreSkill.trim();
          l.duration = d.duration.trim();
          l.primaryCompetencies = splitList(d.primaryCompetencies);
          l.secondaryCompetencies = splitList(d.secondaryCompetencies);
          l.docUrl = d.docUrl.trim();
          l.slidesUrl = d.slidesUrl.trim();
        }
      });
    } else if (editor.kind === "extra") {
      const label = d.label.trim();
      const url = d.url.trim();
      if (!label || !url) {
        return setToast({ kind: "error", message: "Label and URL are required." });
      }
      patch((next) => {
        if (editor.scope === "curriculum") {
          const c = next.curricula[indices.i];
          c.extras = c.extras || [];
          c.extras.push({ label, url });
        } else {
          const c =
            indices.j == null
              ? next.curricula[indices.i]
              : next.curricula[indices.i].competencies[indices.j];
          const lesson = c.lessons[indices.k];
          lesson.extras = lesson.extras || [];
          lesson.extras.push({ label, url });
        }
      });
    }
    setEditor(null);
  }

  // ---- view helpers ----

  function setDraftField(field, value) {
    setEditor((curr) =>
      curr ? { ...curr, draft: { ...curr.draft, [field]: value } } : curr
    );
  }

  // ---- render ----

  if (!authChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="surface-card px-6 py-5 text-sm text-stone-600">
          Checking admin session…
        </div>
      </div>
    );
  }

  if (!isSignedInAdmin) {
    return (
      <>
        <AdminSignInGate
          googleReady={googleReady}
          isBusy={isBusy}
          onSignIn={connectGoogle}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <header className="section-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Admin workspace</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-ink">Curriculum editor</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Edit the same curriculum structure visitors see. This workspace
              mirrors the public pages so you can review hierarchy, resource
              links, and lesson order before publishing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DriveStatusChip
              connected={Boolean(accessToken)}
              adminUser={adminUser}
              manifestFile={manifestFile}
              configured={Boolean(DRIVE_FILE_ID)}
            />
            <button
              type="button"
              onClick={signOutAdmin}
              className="btn-secondary px-3 py-2"
            >
              Sign out
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDriveMenuOpen((v) => !v)}
                className="btn-secondary px-3 py-2"
                aria-haspopup="menu"
                aria-expanded={driveMenuOpen}
              >
                Drive options
              </button>
              {driveMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-stone-200 bg-paper p-2 shadow-lg"
                >
                  <DriveMenuItem
                    disabled={!googleReady || isBusy}
                    onClick={() => {
                      setDriveMenuOpen(false);
                      connectGoogle();
                    }}
                  >
                    Connect Google
                  </DriveMenuItem>
                  <DriveMenuItem
                    disabled={!googleReady || isBusy}
                    onClick={() => {
                      setDriveMenuOpen(false);
                      findManifest();
                    }}
                  >
                    Find {MANIFEST_NAME}
                  </DriveMenuItem>
                  <DriveMenuItem
                    disabled={!googleReady || isBusy}
                    onClick={() => {
                      setDriveMenuOpen(false);
                      openManifestPicker();
                    }}
                  >
                    Pick a file from Drive…
                  </DriveMenuItem>
                  <DriveMenuItem
                    disabled={!googleReady || isBusy}
                    onClick={() => {
                      setDriveMenuOpen(false);
                      createManifest();
                    }}
                  >
                    Create new {MANIFEST_NAME}
                  </DriveMenuItem>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {!googleReady ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Add{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
            and{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_API_KEY</code>{" "}
            to your <code className="font-mono text-xs">.env</code> before
            connecting to Drive.
          </p>
        ) : null}
      </header>

      <AdminBreadcrumb
        curriculum={curriculum}
        competency={competency}
        onHome={() => {
          setCurIdx(null);
          setCompIdx(null);
        }}
        onCurriculum={() => setCompIdx(null)}
      />

      {!curriculum ? (
        <CurriculaView
          curricula={curricula}
          onOpen={(i) => {
            setCurIdx(i);
            setCompIdx(null);
          }}
          onEdit={(i) => openEditCurriculum(i)}
          onDelete={(i) => removeCurriculum(i)}
          onAdd={openAddCurriculum}
        />
      ) : !competency ? (
        <CurriculumView
          curriculum={curriculum}
          curIdx={curIdx}
          onEditCurriculum={() => openEditCurriculum(curIdx)}
          onAttach={(field) =>
            pickGoogleFile((file) =>
              patch((n) => (n.curricula[curIdx][field] = file.url))
            )
          }
          onClearAttach={(field) =>
            patch((n) => (n.curricula[curIdx][field] = ""))
          }
          onOpenCompetency={(j) => setCompIdx(j)}
          onEditCompetency={(j) => openEditCompetency(curIdx, j)}
          onDeleteCompetency={(j) => removeCompetency(curIdx, j)}
          onAddCompetency={() => openAddCompetency(curIdx)}
          onAddLesson={() => openAddLesson(curIdx, null)}
          onEditLesson={(k) => openEditLesson(curIdx, null, k)}
          onDeleteLesson={(k) => removeLesson(curIdx, null, k)}
          onPickLessonFile={(k, field) =>
            pickGoogleFile((file) =>
              patch((n) => (n.curricula[curIdx].lessons[k][field] = file.url))
            )
          }
          onClearLessonFile={(k, field) =>
            patch((n) => (n.curricula[curIdx].lessons[k][field] = ""))
          }
          onAddLessonExtra={(k) => openAddExtra(curIdx, null, k)}
          onRemoveLessonExtra={(k, l) => removeExtra(curIdx, null, k, l)}
          onAddCurriculumExtra={() => openAddCurriculumExtra(curIdx)}
          onRemoveCurriculumExtra={(l) => removeCurriculumExtra(curIdx, l)}
        />
      ) : (
        <CompetencyView
          curriculum={curriculum}
          competency={competency}
          curIdx={curIdx}
          compIdx={compIdx}
          onEditCompetency={() => openEditCompetency(curIdx, compIdx)}
          onAttach={(field) =>
            pickGoogleFile((file) =>
              patch(
                (n) =>
                  (n.curricula[curIdx].competencies[compIdx][field] = file.url)
              )
            )
          }
          onClearAttach={(field) =>
            patch(
              (n) => (n.curricula[curIdx].competencies[compIdx][field] = "")
            )
          }
          onAddLesson={() => openAddLesson(curIdx, compIdx)}
          onEditLesson={(k) => openEditLesson(curIdx, compIdx, k)}
          onDeleteLesson={(k) => removeLesson(curIdx, compIdx, k)}
          onPickLessonFile={(k, field) =>
            pickGoogleFile((file) =>
              patch(
                (n) =>
                  (n.curricula[curIdx].competencies[compIdx].lessons[k][field] =
                    file.url)
              )
            )
          }
          onClearLessonFile={(k, field) =>
            patch(
              (n) =>
                (n.curricula[curIdx].competencies[compIdx].lessons[k][field] = "")
            )
          }
          onAddExtra={(k) => openAddExtra(curIdx, compIdx, k)}
          onRemoveExtra={(k, l) => removeExtra(curIdx, compIdx, k, l)}
        />
      )}

      {editor ? (
        <EditorModal
          editor={editor}
          onClose={() => setEditor(null)}
          onCommit={commitEditor}
          onChange={setDraftField}
          onPickFile={(field) =>
            pickGoogleFile((file) => setDraftField(field, file.url))
          }
        />
      ) : null}

      {isDirty ? (
        <SaveBar
          onSave={saveManifest}
          onDiscard={discardChanges}
          isBusy={isBusy}
          canSave={googleReady && Boolean(manifestFile || DRIVE_FILE_ID)}
        />
      ) : null}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

// =====================  Sub-components  =====================

function AdminSignInGate({ googleReady, isBusy, onSignIn }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <section className="surface-card w-full max-w-xl p-8 text-center">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-ink">
          Sign in to edit the curriculum
        </h1>
        <p className="mt-3 leading-7 text-stone-600">
          Admin changes are saved to Google Drive. Sign in with an authorized
          Google account before viewing or editing curriculum data.
        </p>

        {ADMIN_EMAILS.length ? (
          <p className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
            Allowed admin {ADMIN_EMAILS.length === 1 ? "account" : "accounts"}:{" "}
            <span className="font-bold text-ink">
              {ADMIN_EMAILS.join(", ")}
            </span>
          </p>
        ) : (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            No admin email allowlist is configured. Add{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_ADMIN_EMAILS</code>{" "}
            to restrict who can open this editor.
          </p>
        )}

        {!googleReady ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            Google sign-in is not configured yet. Add{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
            and{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_API_KEY</code>.
          </p>
        ) : null}

        <button
          type="button"
          onClick={onSignIn}
          disabled={!googleReady || isBusy}
          className="btn-primary mt-6 px-6 py-3"
        >
          {isBusy ? "Signing in…" : "Sign in with Google"}
        </button>
      </section>
    </div>
  );
}

function DriveStatusChip({ connected, adminUser, manifestFile, configured }) {
  const color = connected
    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : configured
    ? "bg-stone-50 text-stone-700 border-stone-200"
    : "bg-amber-50 text-amber-900 border-amber-200";
  const label = connected
    ? `${adminUser?.email || "Signed in"} • ${manifestFile?.name || MANIFEST_NAME}`
    : configured
    ? `Loaded ${MANIFEST_NAME}`
    : "Local data";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${color}`}>
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? "bg-emerald-500" : configured ? "bg-stone-400" : "bg-amber-500"
        }`}
        aria-hidden
      />
      {label}
    </span>
  );
}

function DriveMenuItem({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-stone-700 hover:bg-annisa-blue-50 hover:text-annisa-blue-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone-700"
    >
      {children}
    </button>
  );
}

function AdminBreadcrumb({ curriculum, competency, onHome, onCurriculum }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-stone-600">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <button
            onClick={onHome}
            className={`rounded ${
              curriculum
                ? "hover:text-annisa-blue hover:underline"
                : "font-bold text-ink"
            }`}
          >
            Curricula
          </button>
        </li>
        {curriculum ? (
          <>
            <li aria-hidden className="text-stone-300">/</li>
            <li>
              <button
                onClick={onCurriculum}
                className={`rounded ${
                  competency
                    ? "hover:text-annisa-blue hover:underline"
                    : "font-bold text-ink"
                }`}
              >
                {curriculum.title || "Untitled curriculum"}
              </button>
            </li>
          </>
        ) : null}
        {competency ? (
          <>
            <li aria-hidden className="text-stone-300">/</li>
            <li className="font-bold text-ink">
              {competency.title || "Untitled competency"}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}

function CurriculaView({ curricula, onOpen, onEdit, onDelete, onAdd }) {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Public homepage preview</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">Curriculum paths</h2>
          <p className="mt-1 text-sm text-stone-600">
            These cards mirror the visitor homepage. Open a path to edit the
            competencies shown inside it.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="btn-primary"
        >
          Add curriculum
        </button>
      </div>

      {curricula.length === 0 ? (
        <EmptyTile message="No curricula yet." actionLabel="Add Curriculum" onAction={onAdd} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {curricula.map((c, i) => (
            <article
              key={c.id || i}
              className="surface-card group relative overflow-hidden p-7 transition hover:-translate-y-1 hover:border-annisa-blue/30"
            >
              <div
                className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-annisa-blue/70"
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold tracking-[-0.02em] text-ink">
                    {c.title || "Untitled curriculum"}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-stone-400">
                    /{c.id || "no-id"}
                  </p>
                </div>
                <CardActions
                  onEdit={() => onEdit(i)}
                  onDelete={() => onDelete(i)}
                />
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <ResourceRow
                  label="Master Plan"
                  url={c.masterPlan}
                />
                <ResourceRow
                  label="Scenario Cards"
                  url={c.scenarioCards}
                />
              </dl>

              <div className="mt-5 flex justify-between">
                <span className="text-sm text-stone-500">
                  {Array.isArray(c.lessons)
                    ? `${c.lessons.length} lessons (flat sequence)`
                    : `${(c.competencies || []).length} competencies`}
                </span>
                <button
                  onClick={() => onOpen(i)}
                  className="btn-primary px-4 py-1.5"
                >
                  Open section
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CurriculumView({
  curriculum,
  onEditCurriculum,
  onAttach,
  onClearAttach,
  onOpenCompetency,
  onEditCompetency,
  onDeleteCompetency,
  onAddCompetency,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onPickLessonFile,
  onClearLessonFile,
  onAddLessonExtra,
  onRemoveLessonExtra,
  onAddCurriculumExtra,
  onRemoveCurriculumExtra,
}) {
  const isLessonSequence = Array.isArray(curriculum.lessons);
  const competencies = curriculum.competencies || [];
  const lessons = curriculum.lessons || [];
  const extras = curriculum.extras || [];

  return (
    <div className="space-y-8">
      <section className="section-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Curriculum track preview</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-ink md:text-5xl">
              {curriculum.title || "Untitled curriculum"}
            </h2>
            <p className="mt-2 font-mono text-xs text-stone-500">
              /{curriculum.id || "no-id"}
              {curriculum.gradeLabel ? ` · grades ${curriculum.gradeLabel}` : ""}
            </p>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              {isLessonSequence
                ? "This curriculum is a flat, developmental lesson sequence (like 6-8) instead of competency groups. Attach curriculum-wide resources and manage the lessons below."
                : "This is the curriculum header visitors see. Attach the public planning resources and manage the competencies below."}
            </p>
          </div>
          <button
            onClick={onEditCurriculum}
            className="btn-secondary shrink-0"
          >
            Edit details
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <AttachField
            label="Master Plan"
            url={curriculum.masterPlan}
            onPick={() => onAttach("masterPlan")}
            onRemove={() => onClearAttach("masterPlan")}
          />
          <AttachField
            label="Scenario Cards"
            url={curriculum.scenarioCards}
            onPick={() => onAttach("scenarioCards")}
            onRemove={() => onClearAttach("scenarioCards")}
          />
        </div>

        {isLessonSequence ? (
          <div className="mt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-stone-500">
              Curriculum-wide extras
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {extras.map((extra, l) => (
                <span
                  key={`${extra.label}-${l}`}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700"
                >
                  <a
                    href={extra.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-annisa-blue hover:underline"
                  >
                    {extra.label}
                  </a>
                  <button
                    onClick={() => onRemoveCurriculumExtra(l)}
                    className="text-stone-400 hover:text-red-600"
                    aria-label={`Remove ${extra.label}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={onAddCurriculumExtra}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-3 py-1 text-xs text-stone-600 hover:border-annisa-blue hover:text-annisa-blue"
              >
                Add extra resource
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {isLessonSequence ? (
        <LessonEditorList
          title="Lesson sequence"
          heading={`Lessons (${lessons.length})`}
          description="This lesson list mirrors the public curriculum page. Update titles, competencies, resources, and extras here before publishing."
          lessons={lessons}
          showMeta
          onAddLesson={onAddLesson}
          onEditLesson={onEditLesson}
          onDeleteLesson={onDeleteLesson}
          onPickLessonFile={onPickLessonFile}
          onClearLessonFile={onClearLessonFile}
          onAddExtra={onAddLessonExtra}
          onRemoveExtra={onRemoveLessonExtra}
        />
      ) : (
        <section>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Classroom skills</p>
              <h3 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">Competencies</h3>
              <p className="mt-1 text-sm text-stone-600">
                These cards match the public competency grid. Open one to manage
                its lessons and resources.
              </p>
            </div>
            <button
              onClick={onAddCompetency}
              className="btn-primary"
            >
              Add competency
            </button>
          </div>

          {competencies.length === 0 ? (
            <EmptyTile
              message="No competencies yet."
              actionLabel="Add Competency"
              onAction={onAddCompetency}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {competencies.map((comp, j) => (
                <article
                  key={comp.id || j}
                  className="surface-card p-6 transition hover:-translate-y-1 hover:border-annisa-blue/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-annisa-blue/20 bg-annisa-blue-50 font-bold text-annisa-blue-700">
                      {j + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-lg font-bold text-ink">
                        {comp.title || "Untitled competency"}
                      </h4>
                      {comp.summary ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">
                          {comp.summary}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm italic text-stone-400">
                          No summary
                        </p>
                      )}
                    </div>
                    <CardActions
                      onEdit={() => onEditCompetency(j)}
                      onDelete={() => onDeleteCompetency(j)}
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm text-stone-500">
                      {(comp.lessons || []).length} lessons
                    </span>
                    <button
                      onClick={() => onOpenCompetency(j)}
                      className="btn-primary px-4 py-1.5"
                    >
                      Open lessons
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function CompetencyView({
  curriculum,
  competency,
  compIdx,
  onEditCompetency,
  onAttach,
  onClearAttach,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onPickLessonFile,
  onClearLessonFile,
  onAddExtra,
  onRemoveExtra,
}) {
  const lessons = competency.lessons || [];
  return (
    <div className="space-y-8">
      <section className="section-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-annisa-blue/20 bg-annisa-blue-50 text-lg font-bold text-annisa-blue-700">
              {compIdx + 1}
            </div>
            <div className="min-w-0">
              <p className="eyebrow">{curriculum.title}</p>
              <h2 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-ink md:text-5xl">
                {competency.title || "Untitled competency"}
              </h2>
              {competency.summary ? (
                <p className="mt-3 max-w-3xl text-lg leading-8 text-stone-700">{competency.summary}</p>
              ) : null}
            </div>
          </div>
          <button
            onClick={onEditCompetency}
            className="btn-secondary shrink-0"
          >
            Edit details
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <AttachField
            label="Parent Letter"
            url={competency.parentLetter}
            onPick={() => onAttach("parentLetter")}
            onRemove={() => onClearAttach("parentLetter")}
          />
          <AttachField
            label="Materials List"
            url={competency.materialsList}
            onPick={() => onAttach("materialsList")}
            onRemove={() => onClearAttach("materialsList")}
          />
        </div>
      </section>

      <LessonEditorList
        title="Teach this competency"
        heading={`Lessons (${lessons.length})`}
        description="This lesson list mirrors the public competency page. Update titles, resources, and extras here before publishing."
        lessons={lessons}
        onAddLesson={onAddLesson}
        onEditLesson={onEditLesson}
        onDeleteLesson={onDeleteLesson}
        onPickLessonFile={onPickLessonFile}
        onClearLessonFile={onClearLessonFile}
        onAddExtra={onAddExtra}
        onRemoveExtra={onRemoveExtra}
      />
    </div>
  );
}

function LessonEditorList({
  title,
  heading,
  description,
  lessons,
  showMeta = false,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onPickLessonFile,
  onClearLessonFile,
  onAddExtra,
  onRemoveExtra,
}) {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">{heading}</h3>
          <p className="mt-1 text-sm text-stone-600">{description}</p>
        </div>
        <button
          onClick={onAddLesson}
          className="btn-primary"
        >
          Add lesson
        </button>
      </div>

      {lessons.length === 0 ? (
        <EmptyTile
          message="No lessons yet."
          actionLabel="Add Lesson"
          onAction={onAddLesson}
        />
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, k) => {
            const badges = [
              ...(lesson.primaryCompetencies || []),
              ...(lesson.secondaryCompetencies || []),
            ];
            return (
              <article
                key={`${lesson.number}-${k}`}
                className="surface-card p-5 transition hover:shadow-[0_20px_45px_rgba(15,118,110,0.10)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-annisa-blue/20 bg-annisa-blue-50 text-sm font-bold text-annisa-blue-700">
                    {lesson.number || k + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow">Lesson {lesson.number || k + 1}</p>
                    <h4 className="mt-1 text-lg font-bold text-ink">
                      {lesson.title || "Untitled lesson"}
                    </h4>
                    {showMeta && (lesson.coreSkill || lesson.duration) ? (
                      <p className="mt-1 text-sm text-stone-600">
                        {lesson.coreSkill}
                        {lesson.coreSkill && lesson.duration ? " · " : ""}
                        {lesson.duration}
                      </p>
                    ) : null}
                    {showMeta && badges.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {badges.map((b, idx) => (
                          <span
                            key={idx}
                            className="rounded-full border border-annisa-blue/20 bg-annisa-blue-50 px-2.5 py-0.5 text-xs font-bold text-annisa-blue-700"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <AttachField
                        compact
                        label="Lesson Doc"
                        url={lesson.docUrl}
                        onPick={() => onPickLessonFile(k, "docUrl")}
                        onRemove={() => onClearLessonFile(k, "docUrl")}
                      />
                      <AttachField
                        compact
                        label="Slides"
                        url={lesson.slidesUrl}
                        onPick={() => onPickLessonFile(k, "slidesUrl")}
                        onRemove={() => onClearLessonFile(k, "slidesUrl")}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {(lesson.extras || []).map((extra, l) => (
                        <span
                          key={`${extra.label}-${l}`}
                          className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700"
                        >
                          <a
                            href={extra.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-annisa-blue hover:underline"
                          >
                            {extra.label}
                          </a>
                          <button
                            onClick={() => onRemoveExtra(k, l)}
                            className="text-stone-400 hover:text-red-600"
                            aria-label={`Remove ${extra.label}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={() => onAddExtra(k)}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-3 py-1 text-xs text-stone-600 hover:border-annisa-blue hover:text-annisa-blue"
                      >
                        Add extra resource
                      </button>
                    </div>
                  </div>

                  <CardActions
                    onEdit={() => onEditLesson(k)}
                    onDelete={() => onDeleteLesson(k)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CardActions({ onEdit, onDelete }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={onEdit}
        className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-annisa-blue"
        aria-label="Edit"
        title="Edit"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      <button
        onClick={onDelete}
        className="rounded-full p-2 text-stone-500 hover:bg-red-50 hover:text-red-600"
        aria-label="Delete"
        title="Delete"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}

function ResourceRow({ label, url }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-wide text-stone-500">
        {label}
      </span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-bold text-annisa-blue hover:underline"
        >
          {getLinkLabel(url)} ↗
        </a>
      ) : (
        <span className="text-xs italic text-stone-400">Not attached</span>
      )}
    </div>
  );
}

function AttachField({ label, url, onPick, onRemove, compact = false }) {
  const padding = compact ? "px-3 py-2" : "px-3 py-2.5";
  if (url) {
    return (
      <div className={`flex items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white ${padding}`}>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
            {label}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-bold text-annisa-blue hover:underline"
            title={url}
          >
            {getLinkLabel(url)} ↗
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onPick}
            className="rounded-full px-2 py-1 text-xs text-stone-600 hover:bg-stone-100 hover:text-annisa-blue"
            title="Replace"
          >
            Change
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full px-2 py-1 text-xs text-stone-500 hover:bg-red-50 hover:text-red-600"
            title="Remove"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onPick}
      className={`flex w-full items-center justify-between gap-2 rounded-2xl border border-dashed border-stone-300 bg-white ${padding} text-left hover:border-annisa-blue hover:bg-annisa-blue-50/50`}
    >
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wide text-stone-500">
          {label}
        </span>
        <span className="block text-sm text-stone-600">
          Attach from Drive
        </span>
      </span>
      <span className="text-stone-400" aria-hidden>
        ⤴
      </span>
    </button>
  );
}

function EmptyTile({ message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-200 bg-paper p-10 text-center">
      <p className="text-stone-500">{message}</p>
      {actionLabel ? (
        <button
          onClick={onAction}
          className="btn-primary mt-3"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function EditorModal({ editor, onClose, onCommit, onChange, onPickFile }) {
  const titles = {
    curriculum: editor.mode === "create" ? "Add curriculum" : "Edit curriculum",
    competency: editor.mode === "create" ? "Add competency" : "Edit competency",
    lesson: editor.mode === "create" ? "Add lesson" : "Edit lesson",
    extra: "Add extra resource",
  };

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titles[editor.kind]}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-paper shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h3 className="text-lg font-bold text-ink">
            {titles[editor.kind]}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCommit();
          }}
          className="space-y-4 px-5 py-5"
        >
          {editor.kind !== "extra" ? (
            <TextField
              label="Title"
              required
              autoFocus
              value={editor.draft.title}
              onChange={(v) => onChange("title", v)}
            />
          ) : null}

          {editor.kind === "competency" ? (
            <TextField
              label="Summary"
              hint="One short line shown under the competency title."
              value={editor.draft.summary}
              onChange={(v) => onChange("summary", v)}
            />
          ) : null}

          {editor.kind === "lesson" ? (
            <TextField
              label="Number"
              type="number"
              value={editor.draft.number}
              onChange={(v) => onChange("number", v)}
            />
          ) : null}

          {editor.kind === "lesson" && editor.indices?.j == null ? (
            <>
              <p className="text-xs text-stone-500">
                This lesson belongs to a flat lesson-sequence curriculum
                (like 6-8), so it carries its own core skill and CASEL tags
                instead of a parent competency.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Core skill"
                  hint="e.g. Pause → Think → Choose"
                  value={editor.draft.coreSkill}
                  onChange={(v) => onChange("coreSkill", v)}
                />
                <TextField
                  label="Duration"
                  hint="e.g. 40 minutes"
                  value={editor.draft.duration}
                  onChange={(v) => onChange("duration", v)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Primary competencies"
                  hint="Comma-separated, e.g. Self-Awareness, Self-Management"
                  value={editor.draft.primaryCompetencies}
                  onChange={(v) => onChange("primaryCompetencies", v)}
                />
                <TextField
                  label="Secondary competencies"
                  hint="Comma-separated"
                  value={editor.draft.secondaryCompetencies}
                  onChange={(v) => onChange("secondaryCompetencies", v)}
                />
              </div>
            </>
          ) : null}

          {editor.kind === "curriculum" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Grade label"
                  hint='e.g. "6–8" — shown as "grades 6–8" on the public page.'
                  value={editor.draft.gradeLabel}
                  onChange={(v) => onChange("gradeLabel", v)}
                />
                <TextField
                  label="Tagline"
                  hint="Optional short line shown under the title."
                  value={editor.draft.tagline}
                  onChange={(v) => onChange("tagline", v)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DriveAttachInline
                  label="Master Plan"
                  url={editor.draft.masterPlan}
                  onPick={() => onPickFile("masterPlan")}
                  onClear={() => onChange("masterPlan", "")}
                />
                <DriveAttachInline
                  label="Scenario Cards"
                  url={editor.draft.scenarioCards}
                  onPick={() => onPickFile("scenarioCards")}
                  onClear={() => onChange("scenarioCards", "")}
                />
              </div>
              {editor.mode === "create" ? (
                <label className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={editor.draft.lessonSequence}
                    onChange={(e) => onChange("lessonSequence", e.target.checked)}
                  />
                  <span>
                    <span className="font-bold text-stone-700">
                      Flat lesson-sequence curriculum
                    </span>
                    <span className="block text-xs text-stone-500">
                      Like 6-8: lessons listed directly, each with its own
                      CASEL tags, instead of grouped under competencies. This
                      can&rsquo;t be changed after the curriculum is created.
                    </span>
                  </span>
                </label>
              ) : null}
            </>
          ) : null}

          {editor.kind === "competency" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <DriveAttachInline
                label="Parent Letter"
                url={editor.draft.parentLetter}
                onPick={() => onPickFile("parentLetter")}
                onClear={() => onChange("parentLetter", "")}
              />
              <DriveAttachInline
                label="Materials List"
                url={editor.draft.materialsList}
                onPick={() => onPickFile("materialsList")}
                onClear={() => onChange("materialsList", "")}
              />
            </div>
          ) : null}

          {editor.kind === "lesson" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <DriveAttachInline
                label="Lesson Doc"
                url={editor.draft.docUrl}
                onPick={() => onPickFile("docUrl")}
                onClear={() => onChange("docUrl", "")}
              />
              <DriveAttachInline
                label="Slides"
                url={editor.draft.slidesUrl}
                onPick={() => onPickFile("slidesUrl")}
                onClear={() => onChange("slidesUrl", "")}
              />
            </div>
          ) : null}

          {editor.kind === "extra" ? (
            <>
              <TextField
                label="Label"
                required
                autoFocus
                value={editor.draft.label}
                onChange={(v) => onChange("label", v)}
              />
              <DriveAttachInline
                label="Resource"
                url={editor.draft.url}
                onPick={() => onPickFile("url")}
                onClear={() => onChange("url", "")}
              />
              <TextField
                label="Or paste a URL"
                value={editor.draft.url}
                onChange={(v) => onChange("url", v)}
              />
            </>
          ) : null}

          {(editor.kind === "curriculum" || editor.kind === "competency") ? (
            <details
              className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm"
              open={showAdvanced}
              onToggle={(e) => setShowAdvanced(e.currentTarget.open)}
            >
              <summary className="cursor-pointer font-bold text-stone-600">
                Advanced
              </summary>
              <div className="pt-3">
                <TextField
                  label="URL slug"
                  hint="Leave blank to auto-generate from the title."
                  value={editor.draft.id}
                  onChange={(v) => onChange("id", slugify(v))}
                  mono
                />
              </div>
            </details>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {editor.mode === "create" ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, type = "text", required = false, hint, mono = false, autoFocus = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-stone-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <input
        type={type}
        value={value ?? ""}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={`field-input px-3 py-2 ${
          mono ? "font-mono" : ""
        }`}
      />
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </label>
  );
}

function DriveAttachInline({ label, url, onPick, onClear }) {
  if (!url) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-3 py-2 text-left hover:border-annisa-blue hover:bg-annisa-blue-50/50"
      >
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-wide text-stone-500">
            {label}
          </span>
          <span className="block text-sm text-stone-600">
            Choose from Drive
          </span>
        </span>
        <span className="text-stone-400" aria-hidden>⤴</span>
      </button>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
          {label}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm font-bold text-annisa-blue hover:underline"
          title={url}
        >
          {getLinkLabel(url)} ↗
        </a>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onPick}
          className="rounded-full px-2 py-1 text-xs text-stone-600 hover:bg-stone-100 hover:text-annisa-blue"
        >
          Change
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full px-2 py-1 text-xs text-stone-500 hover:bg-red-50 hover:text-red-600"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function SaveBar({ onSave, onDiscard, isBusy, canSave }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-paper/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-stone-700">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-2" aria-hidden />
          You have unsaved changes.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={isBusy}
            className="btn-secondary"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isBusy || !canSave}
            title={
              !canSave
                ? "Connect or create a Drive manifest first."
                : "Save to Drive and publish to the website"
            }
            className="btn-primary px-5"
          >
            {isBusy ? "Publishing…" : "Save & Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const palette = {
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
    error: "bg-red-50 text-red-900 border-red-200",
    info: "bg-slate-50 text-slate-800 border-slate-200",
  };
  const color = palette[toast.kind] || palette.info;
  return (
    <div className="fixed bottom-24 right-4 z-30 max-w-sm">
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${color}`}>
        <p className="text-sm">{toast.message}</p>
        <button
          onClick={onDismiss}
          className="ml-2 text-current opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
