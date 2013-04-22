var Tag = Composer.Model.extend({
	defaults: {
		count: 1	// the number of notes referencing this tag
	},

	initialize: function(data, options)
	{
		if(typeOf(data) == 'string')
		{
			data = {name: data};
		}
		return this.parent.apply(this, [data, options]);
	},

	count: function(inc)
	{
		var newcount = this.get('count') + inc;
		this.set({count: newcount});
		return newcount;
	},

	toJSON: function()
	{
		var data	=	this.parent.apply(this, arguments);
		if(window._toJSON_disable_protect)
		{
			return data;
		}
		else
		{
			return data.name;
		}
	}
});

var Tags = Composer.Collection.extend({
	model: Tag,

	find_by_name: function(tagname)
	{
		return this.find(function(t) { return t.get('name') == tagname; });
	},

	add_tag: function(tag)
	{
		var found = this.find_by_name(tag.get('name'));
		if(found)
		{
			found.count(1);
			return found;
		}
		else
		{
			var json = toJSON(tag);
			json.count = 1;
			var copy = new Tag(json);
			this.add(copy);
			return copy;
		}
	},

	// NOTE: this doesn't actually *remove* the tag unless the count gets to zero
	remove_tag: function(tag)
	{
		var found = this.find_by_name(tag.get('name'));
		if(!found) return false;  // odd, but worth checking for

		var count = found.count(-1);
		if(count == 0)
		{
			this.remove(found);
			return true;
		}
		return found;
	},

	add_tags_from_note: function(note)
	{
		note.get('tags').each(function(t) {
			this.add_tag(t);
		}.bind(this));
	},

	remove_tags_from_note: function(note)
	{
		note.get('tags').each(function(t) {
			this.remove_tag(t);
		}.bind(this));
	},

	diff_tags_from_note: function(note)
	{
		var old_tags = (note.get('old_tags') || []);
		var new_tags = note.get('tags').map(function(t) { return t.get('name'); });

		arrdiff(old_tags, new_tags).each(function(tagname) {
			var tmptag = new Tag(tagname);
			this.remove_tag(tmptag);
		}, this);

		arrdiff(new_tags, old_tags).each(function(tagname) {
			var tmptag = new Tag(tagname);
			this.add_tag(tmptag);
		}, this);
	},

	refresh_from_notes: function(notes_collection)
	{
		if(!notes_collection) return false;
		this.clear();
		notes_collection.models().each(function(p) {
			var tags = p.get('tags', []);
			tags.each(function(t) {
				this.add_tag(t);
			}.bind(this));
		}.bind(this));
		return this;
	}
});

var TagsFilter = Composer.FilterCollection.extend({
});
