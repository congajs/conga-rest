/**
 * @Bass:Document(collection="user_profiles")
 * @Rest:Resource(type="user_profile")
 */
module.exports = class UserProfile {

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
         * @Bass:Field(type="Boolean", name="receive_updates")
         * @Rest:Attribute
         */
        this.receiveUpdates = true;

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
