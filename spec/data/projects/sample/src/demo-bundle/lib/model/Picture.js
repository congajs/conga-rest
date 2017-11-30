/**
 * @Bass:Document(collection="pictures")
 * @Rest:Resource(type="picture")
 */
module.exports = class Picture {

    constructor() {

        /**
         * @Bass:Id
         * @Bass:Field(type="ObjectID", name="_id")
         * @Rest:ID
         */
        this.id = null;

        /**
         * @Bass:Field(type="String", name="url")
         * @Rest:Attribute(type="String", update=false)
         */
        this.url = null;

        /**
         * @Bass:Field(type="Object", name="data")
         * @Rest:Attribute(type="Object", update=false)
         */
        this.data = {};

        /**
         * @Bass:Field(type="String", name="description")
         * @Rest:Attribute(type="String", update=true)
         */
        this.description = null;

        /**
         * @Bass:Version
         * @Bass:Field(type="Number", name="version")
         * @Rest:Attribute(update=false)
         */
        this.version = 0;

        /**
         * @Bass:CreatedAt
         * @Bass:Field(type="Date", name="created_at")
         * @Rest:Attribute(update=false)
         */
        this.createdAt = null;

        /**
         * @Bass:UpdatedAt
         * @Bass:Field(type="Date", name="updated_at")
         * @Rest:Attribute(update=false)
         */
        this.updatedAt = null;
    }

}
