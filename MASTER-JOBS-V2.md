# MASTER MAÎTRE DIGIY JOBS — V2

## Rôle
Moule universel DIGIYLYFE pour l’emploi et les missions locales.

JOBS reste une **mise en relation directe** entre candidat et recruteur.  
Ce MASTER ne devient ni un ATS lourd, ni un logiciel RH, ni une base de CV à vendre, ni un système de paie, ni un système de paiement DIGIYLYFE.

## Doctrine
- candidat gratuit ;
- recruteur adhérent ;
- contact et relation directs ;
- 0 % commission DIGIYLYFE ;
- DIGIYLYFE ne promet ni embauche, ni contrat, ni salaire ;
- les données candidat ne sont jamais exposées publiquement ;
- le recruteur n’accède qu’aux candidatures de son workspace ;
- le candidat garde son droit de correction et de retrait.

## Accès recruteur — magic link
1. bouton discret **🔐 Accès recruteur** ;
2. email déjà autorisé ;
3. `signInWithOtp` avec `shouldCreateUser:false` ;
4. redirection vers `gestion-jobs-v2.html` ;
5. workspace récupéré dans `digiy_jobs_owner_workspaces` ;
6. RLS par `workspace_slug` + `auth_user_id = auth.uid()`.

## Autonomie recruteur légère
Le recruteur peut :
- créer une offre ;
- modifier son intitulé ;
- modifier secteur, ville, pays, type de contrat ;
- modifier rémunération indicative ;
- modifier description et exigences ;
- indiquer logement / accueil famille ;
- modifier son contact ;
- activer ou fermer l’offre ;
- lire uniquement les candidatures reçues dans son workspace ;
- changer le statut d’une candidature et ajouter une note interne.

## Candidat
Le candidat :
- ne paie rien ;
- peut consulter les offres publiques ;
- peut postuler sans créer de compte ;
- donne son consentement avant transmission ;
- n’est jamais rendu public par le MASTER.

Le suivi candidat existant reste séparé et léger. Aucun compte obligatoire n’est ajouté en V2.

## Backend retenu
Réutilisation de :
- `digiy_jobs_owner_workspaces`
- `digiy_jobs_offers_pro`
- `digiy_jobs_candidates_pro`

Aucune nouvelle table nécessaire.

## Sécurité
- clé publishable uniquement ;
- aucun `service_role` navigateur ;
- RLS active sur les trois tables ;
- lecture publique des offres : seulement offres `status='active'` et seulement colonnes non sensibles ;
- aucune lecture publique des candidatures ;
- offres propriétaire : RLS par workspace ;
- candidatures propriétaire : RLS par workspace ;
- impossible au recruteur de changer `workspace_slug`, `owner_id`, `id` ou les clés techniques.

## Langues
FR · EN · ES · PT · IT · DE · NL · AR.  
RTL automatique pour l’arabe.

## Règle atelier
1. Le JOBS public actuel reste intact pendant la préparation.
2. Le MASTER V2 vit dans `atelier-master-jobs-v2`.
3. `workspaceSlug="__MASTER__"` implique `noindex,nofollow`.
4. Une instance configure seulement `workspaceSlug`.
5. Ne jamais inventer salaire, contrat, disponibilité ou conditions.
6. Tester magic link, offres, fermeture, candidature, confidentialité, mobile, 8 langues et RTL.
7. Publier seulement après validation humaine.

## Fichiers V2
- `master-v2.html`
- `gestion-jobs-v2.html`
- `supabase/master-jobs-v2-owner-rls.sql`
