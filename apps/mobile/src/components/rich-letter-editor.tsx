'use dom';

import React from 'react';
import { isHtmlLetterBody, plainTextToLetterHtml } from '@/lib/letter-content';

type Props = {
  initialHtml: string;
  readOnly?: boolean;
  onChange?: (html: string) => Promise<void>;
  onPickImage?: () => Promise<string | null>;
  dom?: import('expo/dom').DOMProps;
};

export default function RichLetterEditor({ initialHtml, readOnly = false, onChange, onPickImage }: Props) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const changeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = isHtmlLetterBody(initialHtml) ? initialHtml : plainTextToLetterHtml(initialHtml);
  }, [initialHtml]);

  React.useEffect(() => () => {
    if (changeTimer.current) clearTimeout(changeTimer.current);
  }, []);

  function emitChange() {
    if (!onChange || !editorRef.current) return;
    if (changeTimer.current) clearTimeout(changeTimer.current);
    changeTimer.current = setTimeout(() => {
      if (editorRef.current) void onChange(editorRef.current.innerHTML);
    }, 120);
  }

  function command(name: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    emitChange();
  }

  async function addLink() {
    const url = window.prompt('Adresse du lien (https://…)');
    if (url) command('createLink', url);
  }

  async function addImage() {
    const url = await onPickImage?.();
    if (url) command('insertImage', url);
  }

  const toolbar: { label: string; title: string; run: () => void }[] = [
    { label: '↶', title: 'Annuler', run: () => command('undo') },
    { label: '↷', title: 'Rétablir', run: () => command('redo') },
    { label: 'G', title: 'Gras', run: () => command('bold') },
    { label: 'I', title: 'Italique', run: () => command('italic') },
    { label: 'S', title: 'Souligné', run: () => command('underline') },
    { label: 'H1', title: 'Titre 1', run: () => command('formatBlock', 'h1') },
    { label: 'H2', title: 'Titre 2', run: () => command('formatBlock', 'h2') },
    { label: 'H3', title: 'Titre 3', run: () => command('formatBlock', 'h3') },
    { label: '≡', title: 'Aligner à gauche', run: () => command('justifyLeft') },
    { label: '≣', title: 'Centrer', run: () => command('justifyCenter') },
    { label: '☷', title: 'Aligner à droite', run: () => command('justifyRight') },
    { label: '☰', title: 'Justifier', run: () => command('justifyFull') },
    { label: '•', title: 'Liste à puces', run: () => command('insertUnorderedList') },
    { label: '1.', title: 'Liste numérotée', run: () => command('insertOrderedList') },
    { label: '―', title: 'Séparateur', run: () => command('insertHorizontalRule') },
    { label: '🔗', title: 'Lien', run: () => void addLink() },
    { label: '▧', title: 'Image', run: () => void addImage() },
  ];

  return (
    <main className={readOnly ? 'readonly' : 'editor-shell'}>
      {!readOnly ? (
        <nav aria-label="Mise en forme du courrier">
          {toolbar.map((item) => <button key={item.title} type="button" title={item.title} aria-label={item.title} onMouseDown={(event) => event.preventDefault()} onClick={item.run}>{item.label}</button>)}
        </nav>
      ) : null}
      <div ref={editorRef} className="letter" contentEditable={!readOnly} suppressContentEditableWarning onInput={emitChange} aria-label={readOnly ? 'Contenu du courrier' : 'Rédiger le courrier'} />
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; min-height: 100%; background: transparent; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #252821; }
        .editor-shell { min-height: 100%; background: #fffdf7; border: 1px solid #e2dfd3; border-radius: 10px; overflow: hidden; }
        .readonly { background: transparent; }
        nav { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; gap: 3px; padding: 6px; border-bottom: 1px solid #e2dfd3; background: #f6f4ec; }
        button { min-width: 31px; height: 30px; padding: 0 7px; border: 1px solid #ddd9cc; border-radius: 6px; background: #fff; color: #252821; font-size: 12px; font-weight: 600; }
        .letter { min-height: 260px; padding: 16px; outline: none; font-family: Georgia, "Times New Roman", serif; font-size: 14px; line-height: 1.7; overflow-wrap: anywhere; }
        .readonly .letter { min-height: 0; padding: 0; font-size: 11px; line-height: 19px; }
        .letter p { margin: 0 0 .75em; }
        .letter h1 { font-size: 1.55em; margin: .8em 0 .45em; }
        .letter h2 { font-size: 1.3em; margin: .75em 0 .4em; }
        .letter h3 { font-size: 1.12em; margin: .7em 0 .35em; }
        .letter ul, .letter ol { padding-left: 1.5em; }
        .letter img { display: block; max-width: 100%; height: auto; margin: .8em auto; border-radius: 6px; }
        .letter a { color: #0e7c3a; text-decoration: underline; }
        .letter hr { border: 0; border-top: 1px solid #d6d2c4; margin: 1.2em 0; }
      `}</style>
    </main>
  );
}
