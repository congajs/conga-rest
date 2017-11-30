/**
 * @Bass:Document(collection="uploads")
 */
module.exports = class Upload {

    constructor() {

        /**
         * @Bass:Id
         * @Bass:Field(type="ObjectID", name="_id")
         */
        this.id = null;

        /**
         * @Bass:Field(type="Object", name="data")
         */
        this.data = [];

        /**
         * @Bass:Field(type="String", name="mime_type")
         */
        this.mimeType = null;

        /**
         * @Bass:Field(type="String", name="extension")
         */
        this.extension = null;

        /**
         * @Bass:Field(type="Object", name="meta")
         */
        this.meta = {};

        /**
         * @Bass:Field(type="Number", name="size")
         */
        this.size = 0;

        /**
         * @Bass:Field(type="Number", name="current_size")
         */
        this.currentSize = 0;

        /**
         * @Bass:Version
         * @Bass:Field(type="Number", name="version")
         */
        this.version = 0;

        /**
         * @Bass:CreatedAt
         * @Bass:Field(type="Date", name="created_at")
         */
        this.createdAt = null;

        /**
         * @Bass:UpdatedAt
         * @Bass:Field(type="Date", name="updated_at")
         */
        this.updatedAt = null;
    }

}
