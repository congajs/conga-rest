/**
 * @Bass:Document(collection="users")
 * @Rest:Resource(type="user")
 */
module.exports = class User {

    constructor() {

        /**
         * @Bass:Id
         * @Bass:Field(type="ObjectID", name="_id")
         * @Rest:ID
         */
        this.id = null;

        /**
         * @Bass:Field(type="Number", name="reference_id")
         * @Rest:Attribute
         */
        this.referenceId = null;

        /**
         * @Bass:Field(type="String", name="internal_comment")
         * @Rest:Attribute
         * @Rest:Group(read=['ADMIN'], write=['ADMIN'])
         */
        this.internalComment = null;

        /**
         * @Bass:Field(type="String", name="email")
         * @Rest:Attribute
         */
        this.email = null;

        /**
         * @Bass:Field(type="String", name="name")
         * @Rest:Attribute
         */
        this.name = null;

        /**
         * @Bass:Field(type="String", name="gender")
         * @Rest:Attribute
         */
        this.gender = null;

        /**
         * @Bass:OneToOne(document="User", name="profile_id")
         * @Rest:EmbeddedRelationship(type="one", relatedType="user_profile")
         */
        this.profile = null;

        /**
         * @Bass:Field(type="Number", name="status")
         * @Rest:Attribute
         * @Rest:MapAttribute({
         *     "0": "INACTIVE",
         *     "1": "ACTIVE",
         *     "99": "ARCHIVED"
         * })
         */
        this.status = 0;

        /**
         * @Bass:Version
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
