// 01）发布项目页（PublishProjectPage）
// pages 层：组装 TopNavbar + 左/右/底 Widget，通过 Hook 串联数据流
import { usePublishEntryFreshFormKey } from '@shared/hooks/usePublishEntryFreshFormKey'
import TopNavbar from '@widgets/top-navbar'
import {
  ProjectPublishLayout,
  ProjectPublishForm,
  ProjectPublishRightColumn,
  ProjectPublishFooter,
  useProjectPublishWidget,
} from '@widgets/project-publish'

import type { LevelCode } from '@shared/types/level'

function PublishProjectPageContent() {
  const {
    draft,
    descriptionContent,
    contentDetailContent,
    tagInput,
    suggestedSkillTags,
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
    handleContentDetailChange,
    addSkillTag,
    removeSkillTag,
    setTagInput,
    handleTagInputKeyDown,
    toggleSuggestedTag,
    handleSaveDraft,
    handlePreview,
    handlePublish,
    handleEvaluate,
    evaluateResult,
    isEvaluating,
    evaluateError,
  } = useProjectPublishWidget()

  return (
    <ProjectPublishLayout
      left={
        <ProjectPublishForm
          channel={draft.channel}
          campusRecruitType={draft.campusRecruitType}
          descriptionValue={descriptionContent.longtext}
          contentDetailValue={contentDetailContent.longtext}
          onChannelChange={setChannel}
          onCampusRecruitTypeChange={setCampusRecruitType}
          onDescriptionChange={handleDescriptionChange}
          onContentDetailChange={handleContentDetailChange}
          evaluateResult={evaluateResult}
          isEvaluating={isEvaluating}
          evaluateError={evaluateError}
          onEvaluate={handleEvaluate}
        />
      }
      right={
        <ProjectPublishRightColumn
          title={draft.title}
          summary={draft.summary}
          onTitleChange={(v) => updateField('title', v)}
          onSummaryChange={(v) => updateField('summary', v)}
          tags={draft.skillTags}
          tagInput={tagInput}
          suggestedSkillTags={suggestedSkillTags}
          onAddTag={addSkillTag}
          onRemoveTag={removeSkillTag}
          onTagInputChange={setTagInput}
          onToggleSuggestedTag={toggleSuggestedTag}
          onTagInputKeyDown={handleTagInputKeyDown}
          amountMin={draft.amountMin}
          amountMax={draft.amountMax}
          level={draft.level}
          duration={draft.duration}
          deadline={draft.deadline}
          onAmountMinChange={(v) => updateField('amountMin', v)}
          onAmountMaxChange={(v) => updateField('amountMax', v)}
          onLevelChange={(v) => updateField('level', v as LevelCode)}
          onDurationChange={(v) => updateField('duration', v)}
          onDeadlineChange={(v) => updateField('deadline', v)}
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
