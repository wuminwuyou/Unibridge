// 01）笔记编辑页（NoteEditorPage）
import { usePublishEntryFreshFormKey } from '@shared/hooks/usePublishEntryFreshFormKey'
import TopNavbar from '@widgets/top-navbar'
import NoteEditorWidget from '@widgets/note-editor'

function NoteEditorPageContent() {
  return (
    <>
      <TopNavbar />
      <NoteEditorWidget />
    </>
  )
}

function NoteEditorPage() {
  const formInstanceKey = usePublishEntryFreshFormKey()
  return <NoteEditorPageContent key={formInstanceKey} />
}

export default NoteEditorPage
