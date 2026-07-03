## Why

当前陪诊员申请只采集身份信息，管理员审批时无法确认申请人擅长的服务内容，患者在公开列表中也看不到可辅助选择陪诊员的能力标签。

这个变更让陪诊员审批结果同时包含身份审核和服务能力确认：申请人必须提交擅长内容，管理员必须确认最终标签后才能审批通过。

## What Changes

- 申请成为陪诊员时，申请人必须提交至少一个擅长服务标签。
- 后台待审核列表展示申请人提交的标签。
- 管理员审批时可以编辑并确认最终标签。
- 审批通过时，后端必须校验最终标签非空。
- 只有最终标签确认且管理员审批通过后，用户角色才会变为 `ESCORT`。
- 陪诊员公开列表返回并展示已确认标签。
- 第一版将标签直接存储在 `EscortProfile` 上，不新增独立标签字典管理。

## Capabilities

### New Capabilities

- `escort-profile`: Defines escort profile application, admin review, approval, and public profile tag visibility requirements.

### Modified Capabilities

- None.

## Impact

- Database: add a tags/specialties field to `EscortProfile`.
- Backend API: update escort application DTO, admin review DTO, pending review list, approval logic, and public profile response.
- Backend validation: new DTO fields must include `class-validator` decorators because `ValidationPipe` uses `whitelist: true`.
- Frontend: update applicant form, admin review UI, API types, i18n text, and public escort cards.
- Out of scope: tag dictionary management, patient-side filtering, tag search, and post-approval tag maintenance pages.
