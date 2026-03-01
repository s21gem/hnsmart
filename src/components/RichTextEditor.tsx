import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, Quote, Undo, Redo, Minus } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-white/80 border-b border-gold-500/30 rounded-t-xl">
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-emerald-100 transition-colors ${editor.isActive('bold') ? 'bg-emerald-200 text-emerald-950' : 'text-slate-600'}`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-emerald-100 transition-colors ${editor.isActive('italic') ? 'bg-emerald-200 text-emerald-950' : 'text-slate-600'}`}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-emerald-100 transition-colors ${editor.isActive('underline') ? 'bg-emerald-200 text-emerald-950' : 'text-slate-600'}`}
        title="Underline"
      >
        <UnderlineIcon size={18} />
      </button>
      
      <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>
      
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
        className={`p-1.5 rounded hover:bg-emerald-100 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-emerald-200 text-emerald-950' : 'text-slate-600'}`}
        title="Heading 2"
      >
        <Heading2 size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
        className={`p-1.5 rounded hover:bg-emerald-100 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-emerald-200 text-emerald-950' : 'text-slate-600'}`}
        title="Heading 3"
      >
        <Heading3 size={18} />
      </button>

      <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>

      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        className={`p-1.5 rounded hover:bg-emerald-100 transition-colors ${editor.isActive('bulletList') ? 'bg-emerald-200 text-emerald-950' : 'text-slate-600'}`}
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
        className={`p-1.5 rounded hover:bg-emerald-100 transition-colors ${editor.isActive('orderedList') ? 'bg-emerald-200 text-emerald-950' : 'text-slate-600'}`}
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }}
        className={`p-1.5 rounded hover:bg-emerald-100 transition-colors ${editor.isActive('blockquote') ? 'bg-emerald-200 text-emerald-950' : 'text-slate-600'}`}
        title="Quote"
      >
        <Quote size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }}
        className="p-1.5 rounded hover:bg-emerald-100 transition-colors text-slate-600"
        title="Horizontal Line"
      >
        <Minus size={18} />
      </button>

      <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>

      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded hover:bg-emerald-100 transition-colors text-slate-600 disabled:opacity-50"
        title="Undo"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded hover:bg-emerald-100 transition-colors text-slate-600 disabled:opacity-50"
        title="Redo"
      >
        <Redo size={18} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[150px]',
      },
    },
  });

  // Update editor content when prop changes externally (e.g., when clearing form)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border border-gold-500/30 rounded-xl bg-white/50 overflow-hidden focus-within:ring-2 focus-within:ring-gold-500 transition-all">
      <MenuBar editor={editor} />
      <div className="p-4 max-h-[300px] overflow-y-auto bg-white/50">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
