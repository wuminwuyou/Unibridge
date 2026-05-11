import React, { useEffect, useMemo, useState } from 'react';

// 01）新增表单字段配置类型（CreateFormField）
export interface CreateFormField {
    key: string;
    label: string;
    required?: boolean;
    placeholder?: string;
    type?: 'text' | 'number' | 'textarea' | 'select' | 'password' | 'datetime-local';
    options?: Array<{ label: string; value: string }>;
}

// 02）新增表单提交值类型（CreateFormValues）
export type CreateFormValues = Record<string, string>;

// 03）新增表单弹窗组件参数类型（CreateFormModalProps）
interface CreateFormModalProps {
    open: boolean;
    title: string;
    fields: CreateFormField[];
    submitText?: string;
    submitting?: boolean;
    onClose: () => void;
    onSubmit: (values: CreateFormValues) => void | Promise<void>;
}

// 04）新增表单弹窗组件（CreateFormModal）
/**
 * 函数名：CreateFormModal
 * 功能：提供通用的新增表单弹窗，可通过字段配置渲染不同业务页面的新增表单。
 * 实现方法：
 * - 根据 fields 动态渲染 input/textarea/select 控件
 * - 打开弹窗时重置默认值，避免复用时污染上一次输入
 * - 提交时统一校验必填字段并回调 onSubmit
 * 输入：
 * - open：弹窗显隐状态
 * - title：弹窗标题
 * - fields：动态字段配置数组
 * - submitText：提交按钮文案，可选
 * - submitting：提交中状态，可选
 * - onClose：关闭回调
 * - onSubmit：提交回调
 * 输出：
 * - 返回值：ReactElement | null（关闭时为 null）
 * - 副作用：更新内部表单状态，并触发外部提交/关闭回调
 */
const CreateFormModal: React.FC<CreateFormModalProps> = ({
    open,
    title,
    fields,
    submitText = '确认新增',
    submitting = false,
    onClose,
    onSubmit,
}) => {
    const initialValues = useMemo<CreateFormValues>(() => {
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

    const [formValues, setFormValues] = useState<CreateFormValues>(initialValues);
    const [validationMsg, setValidationMsg] = useState<string | null>(null);

    // 05）弹窗打开时重置表单（resetFormOnOpen）
    useEffect(() => {
        if (!open) {
            return;
        }
        setFormValues(initialValues);
        setValidationMsg(null);
    }, [open, initialValues]);

    // 06）更新表单字段值（setFieldValue）
    const setFieldValue = (key: string, value: string): void => {
        setFormValues((prev) => ({ ...prev, [key]: value }));
    };

    // 07）提交处理函数（handleSubmit）
    /**
     * 函数名：handleSubmit
     * 功能：执行必填校验并提交新增表单数据。
     * 实现方法：
     * - 阻止原生提交事件
     * - 遍历字段配置检查 required 约束
     * - 通过 onSubmit 透传当前表单值
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
                        const fieldId = `create-form-field-${field.key}`;
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

export default CreateFormModal;
