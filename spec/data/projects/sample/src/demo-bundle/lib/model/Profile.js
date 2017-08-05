/**
 * @Rest:Resource(type="profile")
 */
module.exports = class Profile {

    constructor() {

        /**
         * @Rest:ID
         */
        this.id = null;

        /**
         * @Rest:Attribute
         */
        this.gender = null;

        /**
         * @Rest:Attribute
         */
        this.age = 0;

        /**
         * @Rest:Attribute
         */
        this.state = null;

        /**
         * @Rest:Attribute
         */
        this.name = null;

        /**
         * @Rest:Attribute
         */
        this.hobbies = [];

        /**
         * @Rest:Attribute(type="Boolean")
         */
        this.isCool = false;

        /**
         * @Bass:Field(type="Number", name="version")
         * @Rest:Attribute(update=false)
         */
        this.version = 0;

        /**
         * @Bass:CreatedAt
         * @Bass:Field(type="Date", name="created_at")
         * @Rest:Attribute(type="Date", format="YYYY-MM-DD", update=false)
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
