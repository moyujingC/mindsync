# 个人职业叙事作品集网站部署说明

> 状态：current
> last_updated：2026-06-05
> 域名：xinran.jingshu.cc
> 部署宿主：101.43.98.40

## 当前部署口径

这是一个 Vite + React 静态站点。当前部署在腾讯云 `101.43.98.40` 的独立 Nginx 站点中。

- 站点目录：`/var/www/xinran-portfolio`
- 当前软链接：`/var/www/xinran-portfolio/current`
- 当前 release：`/var/www/xinran-portfolio/releases/20260605-portfolio`
- Nginx 配置：`/etc/nginx/sites-available/xinran-portfolio.conf`
- Nginx enabled 链接：`/etc/nginx/sites-enabled/xinran-portfolio.conf`
- HTTPS 证书：`/etc/letsencrypt/live/xinran.jingshu.cc/`

## 本地构建

```bash
npm install
npm run portfolio:pdf
npm run build
```

先生成 PDF，再构建站点。Vite 会将 `public/` 复制到 `dist/`；如果先构建，发布目录会包含上一版 PDF。

构建产物在 `dist/`，不提交到 Git。

## 手动部署

```bash
rsync -az --delete \
  -e 'ssh -i /Users/xinran/.ssh/CCKey.pem -o IdentitiesOnly=yes' \
  dist/ ubuntu@101.43.98.40:/tmp/xinran-portfolio-dist/
```

服务器侧：

```bash
release=/var/www/xinran-portfolio/releases/$(date +%Y%m%d-%H%M%S)
sudo mkdir -p "$release"
sudo rsync -a --delete /tmp/xinran-portfolio-dist/ "$release"/
sudo ln -sfn "$release" /var/www/xinran-portfolio/current
sudo chown -R www-data:www-data /var/www/xinran-portfolio
sudo nginx -t
sudo systemctl reload nginx
```

## 验证

```bash
curl -I http://xinran.jingshu.cc
curl -I https://xinran.jingshu.cc
```

预期：

- HTTP 返回 `301` 跳转到 HTTPS。
- HTTPS 返回 `200`。

## 证书

证书由 certbot 管理，当前已启用自动续期。

```bash
sudo certbot certificates -d xinran.jingshu.cc
```
