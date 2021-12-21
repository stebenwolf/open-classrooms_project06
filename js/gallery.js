import { Photograph } from "./photograph.js";
import { Media } from "./media.js";
// La classe GALLERY gère l'affichage d'une série d'éléments, soit les profils des différents photographes sur la page d'accueil, soit la liste des médias d'un photographe sur sa page dédiée.
// la classe "mère" va récupérer les données dans un fichier JSON, procédure commune aux deux types de galeries
// elle se décompose ensuite en deux sous-classes : une première qui va traiter le cas spécifique de la galerie photographes, et la seconde qui va s'occuper exclusivement des photos et vidéos d'un artiste donné.
class Gallery {
    // cette méthode, commune aux deux sous-classes, va récupérer les données du fichier JSON. 
    // Elle prend en entrée le type de données à chercher (photographers ou medias)
    // et renvoie la liste des résultats (mais on n'en a encore rien fait)
    async fetchDataAsync(type = ("photographers" || "media")) {
        if (type === "photographers" || type === "media") {
            try {
                let response = await fetch("../requirements/FishEyeData.json");
                let data = await response.json();
                return data[type];
            }
            catch (error) {
                console.error("Erreur dans la fonction fetchDataAsync : ", error);
            }
        }
        else {
            return console.log("Fonction fetchDataAsync : Argument invalide");
        }
    }
}
class GalleryOfPhotographs extends Gallery {
    //Cette méthode prend en entrée un objet "Galerie de photographes", cherche les données correspondantes dans le fichier json, et appelle la fonction showThemAll.
    displayGallery(type) {
        type.fetchDataAsync("photographers").then(results => this.showThem(results, "index"));
    }
    displayInfos(type) {
        type.fetchDataAsync("photographers").then(results => this.showThem(results, "profile"));
    }
    // Cette méthode prend en entrée le résultat de la requête asynchrone
    // et renvoie à partir de là l'ensemble des informations nécessaires à la réalisation :
    // - soit des cartes des photographes sur la page d'accueil si le type vaut "index"
    // - soit pour chaque photographe du bandeau d'informations de sa page de profile 
    showThem(results, type) {
        let parameters = new URLSearchParams(document.location.search.substring(1));
        let profileID = parameters.get("id");
        let tag = parameters.get("tag");
        // pour chaque élément de results, on créé un objet Photograph qui contient l'ensemble des informatiins dont on a besoin.
        for (let item of results) {
            const photograph = new Photograph(item.id, item.name, item.city, item.country, item.tags, item.tagline, item.price, item.portrait);
            if (type == "profile") {
                if (item.id == profileID) {
                    return photograph.createPhotographProfile(photograph);
                }
            }
            else if (type == "index") {
                if (profileID === null) {
                    if (tag === null) {
                        photograph.createPhotographCard(photograph);
                    }
                    else if (photograph.tags.includes(tag)) {
                        photograph.createPhotographCard(photograph);
                    }
                }
                else if (photograph.id === +profileID) {
                    photograph.createPhotographCard(photograph);
                }
            }
        }
    }
    // cette méthode doit retrouver, à partir d'un simple id, les infos relatives à un photographe et créer l'objet associé.
    createPhotograph(id) {
        let type = new GalleryOfPhotographs;
        type.displayGallery(type);
        let photograph;
        type.fetchDataAsync("photographers").then(results => {
            for (let item of results) {
                if (item.id == id) {
                    console.log("item trouvé!");
                    photograph = new Photograph(+item.id, item.name, item.city, item.country, item.tags, item.tagline, +item.price, item.portrait);
                }
            }
            return photograph;
        });
    }
}
class GalleryOfMedias extends Gallery {
    //Cette méthode prend en entrée un objet "Galerie de médias", cherche les données correspondantes dans le fichier json, et appelle la fonction showThemAll.
    displayGallery(type) {
        type.fetchDataAsync("media").then(results => {
            this.showThemAll(results);
        });
    }
    // Cette méthode prend en entrée le résultat de la requête asynchrone
    // ...et renvoie à partir de ça l'ensemble des informations nécessaires, avec la condition "id page" = "id photographe"
    // Ce qu'on veut aussi, c'est qu'à chaque fois qu'on modifie le tri, la liste se mette à jour.
    showThemAll(results) {
        let parameters = new URLSearchParams(document.location.search.substring(1));
        let profileID = parameters.get("id");
        // on créé une liste contenant uniquement les résultats qui nous intéressent
        let list = [];
        for (let item of results) {
            if (item.photographerId == +profileID) {
                list.push(item);
            }
        }
        let selectTracker = document.getElementById("order-by");
        this.sortedList(list, selectTracker.value);
        selectTracker.addEventListener("change", () => this.showThemAll(results)); // Pour le event Listener, on relance cette méthode plutôt que la méthode "liste triée". A voir quel impact en termes de performance : les variables paramètres, profileID et la liste ne changent pas, seul l'ordre de la liste évolue.
    }
    sortedList(list, sortingStyle) {
        switch (sortingStyle) {
            case "popularity":
                list = this.sortByLikes(list);
                break;
            case "date":
                list = this.sortByDate(list);
                break;
            case "title":
                list = this.sortByName(list);
        }
        // On efface le contenu déjà présent
        const gallerySection = document.querySelector(".gallery");
        gallerySection.innerHTML = "";
        // Pour chaque élément de la liste, on créé l'objet associé
        console.log(list.length);
        for (let item of list) {
            const media = new Media(item.id, item.photographerId, item.title, item.image, item.tags, item.likes, item.date, item.price);
            media.createMedia(media);
            media.openModal(media);
        }
        return list;
    }
    // Pour les trois méthodes ci-dessous, on prend en paramètre une liste (celle des résultats de la requête JSON), et on renvoit la liste triée : soit par nombre de likes, soit par titre, soit par date.
    // source : https://stackoverflow.com/a/19326174/15450868
    // inorganik
    // Cette fonction prend en entrée une liste et renvoie la liste triée par nombre de likes par ordre décroissant
    sortByLikes(list) {
        // "resultats" est un array d'objets, et on veut pouvoir trier les objets en fonction de la valeur d'une de leurs clés
        let byLikes = list.slice(0); // on copie la liste initiale
        byLikes.sort(function (a, b) {
            return b.likes - a.likes; // on trie la nouvelle liste par ordre décroissant
        });
        return byLikes;
    }
    // cette fonction prend en entrée une liste et renvoie la liste triée par ordre alphabétique croissant
    sortByName(list) {
        let byName = list.slice(0);
        byName.sort(function (a, b) {
            let x = a.title.toLowerCase();
            let y = b.title.toLowerCase();
            return x < y ? -1 : x > y ? 1 : 0;
        });
        return byName;
    }
    // cette fonction prend en entrée une liste et renvoie la liste triée par ordre antichronologique
    sortByDate(list) {
        let byDate = list.slice(0);
        byDate.sort(function (a, b) {
            // pour trier les dates qui sont actuellement au format string "YYYY-MM-DD", on compare leur timestamp via un Date.parse(), sans changer le format de la variable.
            return Date.parse(b.date) - Date.parse(a.date);
        });
        return byDate;
    }
}
export { Gallery, GalleryOfPhotographs, GalleryOfMedias };
//# sourceMappingURL=gallery.js.map