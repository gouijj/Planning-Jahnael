# Protéger les données de l'appli (Firebase)

Aujourd'hui, la base Firebase est ouverte : toute personne qui connaît son adresse peut lire les humeurs, les réflexions, les soucis et la photo de Jahnael. Le code publié sur GitHub Pages étant public, cette adresse est visible.

Tant que la clé API n'est pas renseignée, l'appli continue de fonctionner comme avant. Suivez les étapes **dans cet ordre**, sinon les appareils non connectés ne pourront plus lire le planning.

## 1. Créer le compte famille
1. Console Firebase → votre projet **planning-jahnael** → **Authentication** → **Commencer**.
2. Onglet **Sign-in method** → activer **Adresse e-mail/Mot de passe**.
3. Onglet **Users** → **Ajouter un utilisateur** : une adresse e-mail et un mot de passe solide (ce sera le compte partagé par tous les appareils de la famille).
4. Copier l'**UID utilisateur** affiché dans la liste.

## 2. Renseigner la clé API dans l'appli
1. Console Firebase → ⚙️ **Paramètres du projet** → onglet **Général** → copier la **Clé API Web**.
2. Dans `index.html`, remplacer :
   ```js
   const FIREBASE_API_KEY = '';
   ```
   par :
   ```js
   const FIREBASE_API_KEY = 'la-clé-copiée';
   ```
3. Publier sur GitHub Pages.

La clé API Web n'est pas un secret : elle identifie le projet. La protection vient des règles de l'étape 4.

## 3. Connecter chaque appareil (une seule fois)
Sur chaque appareil (tablette, téléphone de Jahnael, téléphones des parents) :
⚙️ Réglages → Mode parent → **🔐 Protection des données** → e-mail + mot de passe du compte famille → **Se connecter**.

L'appareil reste connecté ensuite (la session se renouvelle toute seule).

## 4. Activer les règles de sécurité
Seulement quand **tous** les appareils sont connectés :
1. Console Firebase → **Realtime Database** → onglet **Règles**.
2. Coller le contenu de `database.rules.json` en remplaçant `REMPLACER_PAR_UID_DU_COMPTE_FAMILLE` par l'UID copié à l'étape 1.
3. **Publier**.

À partir de là, seuls les appareils connectés au compte famille peuvent lire ou écrire les données.

## Code parent
- Le code n'apparaît plus en clair dans le code source (seule son empreinte SHA-256 y figure). Le code actuel reste inchangé.
- Il peut être changé dans ⚙️ Réglages → **🔑 Changer le code parent** ; le nouveau code vaut pour tous les appareils.
- Un code à 4 chiffres reste un simple verrou « anti-curiosité » pour un enfant, pas une vraie sécurité : c'est le compte famille et les règles Firebase qui protègent réellement les données.
