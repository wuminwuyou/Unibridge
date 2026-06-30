// 01）发布项目页（PublishProjectPage）
// pages 层：组装 TopNavbar + 左/右/底 Widget，通过 Hook 串联数据流
import { usePublishEntryFreshFormKey } from '@shared/hooks/usePublishEntryFreshFormKey'
import TopNavbar from '@widgets/top-navbar'
import {
  ProjectPublishLayout,
  ProjectPublishForm,
  ProjectPublishPreview,
  ProjectPublishFooter,
  useProjectPublishWidget,
} from '@widgets/project-publish'

import type { LevelCode } from '@shared/types/level'

function PublishProjectPageContent() {
  const {
    draft,
    displaySummary,
    descriptionContent,
    tagInput,
    suggestedSkillTags,
    completionPercent,
    isSubmitting,
    submitError,
    leavePromptOpen,
    leavePromptMessage,
    confirmLeave,
    cancelLeave,
    updateField,
    setChannel,
    setCampusRecruitType,
    handleDescriptionChange,
    addSkillTag,
    removeSkillTag,
    setTagInput,
    handleTagInputKeyDown,
    toggleSuggestedTag,
    handleSaveDraft,
    handlePreview,
    handlePublish,
    publishChecklistItems,
    resolvePublishPreviewBadge,
  } = useProjectPublishWidget()

  return (
    <ProjectPublishLayout
      form={
        <ProjectPublishForm
          draft={{
            title: draft.title,
            summary: draft.summary,
            channel: draft.channel,
            campusRecruitType: draft.campusRecruitType,
            amount: draft.amount,
            level: draft.level,
            duration: draft.duration,
            teamSize: draft.teamSize,
            skillTags: draft.skillTags,
            deadline: draft.deadline,
          }}
          descriptionValue={descriptionContent.longtext}
          tagInput={tagInput}
          suggestedSkillTags={suggestedSkillTags}
          completionPercent={completionPercent}
          onTitleChange={(v) => updateField('title', v)}
          onSummaryChange={(v) => updateField('summary', v)}
          onAmountChange={(v) => updateField('amount', v)}
          onLevelChange={(v) => updateField('level', v as LevelCode)}
          onDurationChange={(v) => updateField('duration', v)}
          onTeamSizeChange={(v) => updateField('teamSize', v)}
          onDeadlineChange={(v) => updateField('deadline', v)}
          onChannelChange={setChannel}
          onCampusRecruitTypeChange={setCampusRecruitType}
          onDescriptionChange={handleDescriptionChange}
          onAddTag={addSkillTag}
          onRemoveTag={removeSkillTag}
          onTagInputChange={setTagInput}
          onToggleSuggestedTag={toggleSuggestedTag}
          onTagInputKeyDown={handleTagInputKeyDown}
        />
      }
      preview={
        <ProjectPublishPreview
          badge={resolvePublishPreviewBadge(draft)}
          title={draft.title}
          summary={displaySummary}
          amount={draft.amount}
          level={draft.level}
          tags={draft.skillTags}
          checklistItems={publishChecklistItems}
        />
      }
      footer={
        <ProjectPublishFooter
          submitError={submitError}
          isSubmitting={isSubmitting}
          leavePromptOpen={leavePromptOpen}
          leavePromptMessage={leavePromptMessage}
          onSaveDraft={handleSaveDraft}
          onPreview={handlePreview}
          onPublish={handlePublish}
          onConfirmLeave={confirmLeave}
          onCancelLeave={cancelLeave}
        />
      }
    />
  )
}

export default function PublishProjectPage() {
  const formInstanceKey = usePublishEntryFreshFormKey()
  return (
    <>
      <TopNavbar />
      <PublishProjectPageContent key={formInstanceKey} />
    </>
  )
}
