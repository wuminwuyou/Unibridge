import React, { useEffect, useMemo, useState } from 'react';
import { type CreateFormField, type CreateFormValues } from './CreateFormModal';

// 01）修改表单弹窗组件参数类型（EditFormModalProps）
interface EditFormModalProps {
    open: boolean;
    title: string;
    fields: CreateFormField[];
    initialValues?: Partial<CreateFormValues>;
    submitText?: string;
    submitting?: boolean;
    onClose: () => void;
    onSubmit: (values: CreateFormValues) => void | Promise<void>;
}

// 02）通用修改表单弹窗组件（EditFormModal）
/**
 * 函数名：EditFormModal
 * 功能：提供可复用的修改表单弹窗，支持根据字段配置渲染表单并回填初始值。
 * 实现方法：
 * - 基于 fields 统一生成默认表单值，避免不同业务页面重复实现
 * - 弹窗打开时将 initialValues 合并进默认值，实现编辑场景的回填
 * - 提交前执行必填校验，校验通过后回调 onSubmit
 * 输入：
 * - open：弹窗显隐状态
 * - title：弹窗标题
 * - fields：动态字段配置数组
 * - initialValues：回填初始值，可选
 * - submitText：提交按钮文案，可选
 * - submitting：提交中状态，可选
 * - onClose：关闭回调
 * - onSubmit：提交回调
 * 输出：
 * - 返回值：ReactElement | null（关闭时为 null）
 * - 副作用：更新内部表单与校验状态，并触发外部提交/关闭回调
 */
const EditFormModal: React.FC<EditFormModalProps> = ({
    open,
    title,
    fields,
    initialValues,
    submitText = '确认修改',
    submitting = false,
    onClose,
    onSubmit,
}) => {
    const defaultValues = useMemo<CreateFormValues>(() => {
        const next: CreateFormValues = {};
        fields.forEach((field) => {
            if (field.type === 'select' && field.options && field.options.length > 0) {
                next[field.key] = field.options[0].value;
                return;
            }
            next[field.key] = '';
        });
        return next;
    }, [fields]);

    const [formValues, setFormValues] = useState<CreateFormValues>(defaultValues);
    const [validationMsg, setValidationMsg] = useState<string | null>(null);

    // 03）弹窗打开时回填编辑数据（hydrateFormOnOpen）
    useEffect(() => {
        if (!open) {
            return;
        }
        setFormValues({ ...defaultValues, ...(initialValues ?? {}) });
        setValidationMsg(null);
    }, [open, defaultValues, initialValues]);

    // 04）更新表单字段值（setFieldValue）
    const setFieldValue = (key: string, value: string): void => {
        setFormValues((prev) => ({ ...prev, [key]: value }));
    };

    // 05）提交处理函数（handleSubmit）
    /**
     * 函数名：handleSubmit
     * 功能：执行必填校验并提交修改表单数据。
     * 实现方法：
     * - 阻止原生提交事件
     * - 遍历字段配置检查 required 约束
     * - 通过 onSubmit 将当前表单值回传给调用方
     * 输入：
     * - event：表单提交事件对象
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 validationMsg 状态并调用 onSubmit
     */
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        for (const field of fields) {
            if (!field.required) {
                continue;
            }
            const value = (formValues[field.key] ?? '').trim();
            if (!value) {
                setValidationMsg(`${field.label}不能为空`);
                return;
            }
        }
        setValidationMsg(null);
        await onSubmit(formValues);
    };

    if (!open) {
        return null;
    }

    return (
        <div
            className="create-form-modal-overlay"
            onClick={(event) => {
                if (event.target === event.currentTarget && !submitting) {
                    onClose();
                }
            }}
        >
            <div className="create-form-modal" role="dialog" aria-modal="true" aria-label={title}>
                <div className="create-form-modal__header">
                    <h3>{title}</h3>
                    <button
                        type="button"
                        className="detail-modal__close"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        关闭
                    </button>
                </div>

                <form className="create-form-modal__form" onSubmit={(event) => { void handleSubmit(event); }}>
                    {fields.map((field) => {
                        const fieldId = `edit-form-field-${field.key}`;
                        const value = formValues[field.key] ?? '';
                        return (
                            <div key={field.key} className="create-form-modal__field">
                                <label htmlFor={fieldId}>
                                    {field.label}
                                    {field.required ? ' *' : ''}
                                </label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        id={fieldId}
                                        placeholder={field.placeholder}
                                        value={value}
                                        disabled={submitting}
                                        rows={4}
                                        onChange={(event) => setFieldValue(field.key, event.target.value)}
                                    />
                                ) : field.type === 'select' ? (
                                    <select
                                        id={fieldId}
                                        value={value}
                                        disabled={submitting}
                                        onChange={(event) => setFieldValue(field.key, event.target.value)}
                                    >
                                        {(field.options ?? []).map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        id={fieldId}
                                        type={field.type ?? 'text'}
                                        placeholder={field.placeholder}
                                        value={value}
                                        disabled={submitting}
                                        onChange={(event) => setFieldValue(field.key, event.target.value)}
                                    />
                                )}
                            </div>
                        );
                    })}

                    {validationMsg ? <div className="create-form-modal__error">{validationMsg}</div> : null}

                    <div className="create-form-modal__actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                            取消
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? '提交中...' : submitText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditFormModal;
