"use strict";

const Domain = require('./Domain');

class DomainList {
    constructor () {
        this.List = [];
    }

    /**
     * 
     * Add a domain to the list.
     * @param {Domain} domain 
     */
    Add(domain) {
        this.List.push(domain);
    }

    /**
     * Remove a domain from the list.
     * @param {Domain} domain 
     */
    Remove (domain) {
        var self = this;
        this.List.forEach(function(dom, index) {
            if (dom == domain) {
                self.List.splice(index, 1);
            }
        });
    }

    GetDomainByName(name) {
        let domain;
        for (var dom of this.List) {
            
            if (dom.Name == name) {
                domain = dom;
            }
        }

        if (domain == null) {
            throw new Error(`domain '${name}' does not exist`);
        }

        return domain;
    }
}

module.exports = DomainList;