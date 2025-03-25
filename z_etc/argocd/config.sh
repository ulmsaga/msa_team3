# ArgoCD 네임스페이스로 전환
kubectl config set-context --current --namespace=group1-team3

# 설정 적용
kubectl apply -f z_etc/argocd/argocd_config.yaml

# ArgoCD 재시작 (필요한 경우)
kubectl rollout restart deployment argocd-server argocd-repo-server argocd-redis
kubectl rollout restart statefulset argocd-application-controller