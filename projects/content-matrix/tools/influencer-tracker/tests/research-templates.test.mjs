import test from 'node:test';
import assert from 'node:assert/strict';
import { applyResearchTemplate, listResearchTemplates } from '../src/orchestration/research-templates.mjs';

test('research templates expose the four supported business orchestrations', () => {
  assert.deepEqual(listResearchTemplates().map((template) => template.id), [
    'enterprise_ai_service',
    'moyujing',
    'yijing_yishu',
    'client_project',
  ]);
});

test('enterprise AI service template sets market-research defaults without replacing explicit limits', () => {
  const request = applyResearchTemplate({
    templateId: 'enterprise_ai_service',
    request: {
      collect: { mode: 'search', platform: 'douyin', keyword: '企业 AI 服务', limit: 3 },
    },
  });

  assert.equal(request.purpose, '评论挖需求');
  assert.equal(request.serviceDirection, '企业 AI 服务');
  assert.equal(request.targetAccount, '墨予镜');
  assert.equal(request.collect.limit, 3);
  assert.equal(request.collect.includeComments, true);
  assert.equal(request.orchestration.outputFocus, '服务假设');
});

test('yijing yishu template preserves anonymous and non-diagnostic constraints', () => {
  const request = applyResearchTemplate({
    templateId: 'yijing_yishu',
    request: { collect: { mode: 'detail', platform: 'xiaohongshu', shareUrl: 'https://example.com/note' } },
  });

  assert.equal(request.targetAccount, '一镜一梳');
  assert.equal(request.collect.includeComments, false);
  assert.equal(request.orchestration.followUpWorkflow, '媒体提纯');
  assert.match(request.orchestration.constraints.join('\n'), /不记录或推断可识别个人信息/);
  assert.match(request.orchestration.constraints.join('\n'), /不输出心理诊断/);
});

test('client project template requires an internal project code and keeps it in orchestration metadata', () => {
  assert.throws(
    () => applyResearchTemplate({
      templateId: 'client_project',
      request: { collect: { mode: 'search', platform: 'xiaohongshu', keyword: '客户行业' } },
    }),
    /requires projectName/,
  );

  const request = applyResearchTemplate({
    templateId: 'client_project',
    projectName: 'client-2026-retail-pilot',
    request: { collect: { mode: 'search', platform: 'xiaohongshu', keyword: '门店 AI' } },
  });
  assert.equal(request.targetAccount, 'client-2026-retail-pilot');
  assert.equal(request.orchestration.projectName, 'client-2026-retail-pilot');
  assert.match(request.orchestration.constraints.join('\n'), /客户非公开资料/);
});
