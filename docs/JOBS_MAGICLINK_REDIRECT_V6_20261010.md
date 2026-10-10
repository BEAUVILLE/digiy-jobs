# DIGIY JOBS V6 — retour du magic link recruteur vers la gestion

**Incident terrain 10/10/2026 :** BUILD réussi ; JOBS renvoie à un index au lieu du cockpit recruteur.

## Diagnostic comparé

- BUILD qui fonctionne demande exactement `https://build.digiylyfe.com/gestion-build-v2.html` (adresse fixe).
- JOBS avant V6 construisait `https://jobs.digiylyfe.com/gestion-jobs-v2.html?workspace=…&lang=…` (adresse variable) dans `acces-recruteur-v2.html` et `master-v2.html`.
- Supabase Auth impose que `emailRedirectTo` corresponde aux **Redirect URLs** autorisées ; une URL variable peut être rejetée si seule la version sans paramètres est permise, ce qui expliquerait la redirection par défaut vers l'index. **Cause très probable, non confirmée tant qu'un nouveau magic link réel n'a pas été cliqué.**
- Aucun token d'authentification ne doit être copié ni partagé dans un ticket.

## V6

- Les deux entrées recrutent vers **exactement** `https://jobs.digiylyfe.com/gestion-jobs-v2.html`, sans paramètres, comme BUILD.
- Au retour, une session Supabase réelle doit être établie sur le sous-domaine JOBS, puis la gestion détermine l'unique `digiy_jobs_owner_workspaces` actif rattaché à `auth.uid()` sous RLS ; elle refuse un compte sans workspace. Ce mécanisme avait déjà été intégré en V5 et possède des tests.
- Le `index.html` public propose maintenant **🏢 ACCÈS RECRUTEUR** qui revient à `acces-recruteur-v2.html` si un utilisateur s'égare à l'index.
- Les 4 offres et 8 candidatures historiques ne sont **pas** associées au workspace pilote (0 offres / 0 candidature). Le pilote est rattaché au compte de son demandeur, aucun privilège générique ouvert.

## Vérification de configuration SUPABASE indispensable

1. Sur `https://supabase.com/dashboard/project/wesqmwjjtsefyjnluosj/auth/url-configuration`, vérifier la liste **Redirect URLs**.
2. Autoriser **exactement** `https://jobs.digiylyfe.com/gestion-jobs-v2.html` si absent. Ne pas modifier l'URL de site par défaut ni effacer les redirections légitimes BUILD, LOC, COMMERCE, etc. Ne pas ajouter de joker global `**` sur tout le domaine.
3. Ne pas modifier le modèle email sauf si le magic link conserve toujours une redirection figée vers la page d'accueil. Le modèle doit utiliser la confirmation tenant compte de `redirect_to` (typiquement `{{ .ConfirmationURL }}`) et non simplement `{{ .SiteURL }}`.
4. Sur navigateur privé : ouvrir `https://jobs.digiylyfe.com/acces-recruteur-v2.html?workspace=pilote-jobs-baptiste-digiy&lang=fr`, saisir l'email Auth du propriétaire, demander un **nouveau** lien email et cliquer dessus (un ancien email n'est pas un test de cette V6).
5. Résultat : **Gestion recruteur — ATELIER DIGIYLYFE · TEST ACCÈS RECRUTEUR** ; les listes d'offres et de candidatures du pilote doivent rester vides. Si retour à l'index persiste, inspecter l'URL exacte du navigateur **sans les paramètres de token et sans les partager publiquement**, puis les Redirect URLs et le modèle Auth.

Sources officielles : https://supabase.com/docs/guides/auth/redirect-urls et https://supabase.com/docs/guides/troubleshooting/why-am-i-being-redirected-to-the-wrong-url-when-using-auth-redirectto-option-_vqIeO

**Recette manuelle requise** : les tests automatisés prouvent le paramètre demandé à l'API et l'isolement de l'espace, pas le traitement du lien dans Supabase Auth ni la livraison de l'email.
