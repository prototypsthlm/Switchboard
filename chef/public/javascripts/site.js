function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function setValueSources(){
    
    var activeRoutineElements = $("div.api.live");
    activeRoutineElements.each(function(i, obj){
         var action = $(this).find("select.methods").val();
         $selectEl = $(this).find("#"+action).find("select[name=output_node]");
         $selectEl.html("");
        if(i == 0){
            $selectEl.html("<option value='entry query'>entry query</option>");
        }
        else {
            $prevRoutineElement = $(activeRoutineElements[i-1]);
            var prevName = $prevRoutineElement.attr('name').replace(".","\\.");
            $referenceElement = $("div[name=" + prevName + "].dummy");
            var prevAction = $prevRoutineElement.find("select.methods").val();
            $prevSelectEl = $referenceElement.find("#"+prevAction).find("select[name=output_node]");
            $selectEl.html($prevSelectEl.html());     
        }
        
    });
}
$(document).ready(function(){
    
    var actionConfig;
    
    $("select.methods option:selected").each(function(){
        $(this).parents("div.api").find('#'+$(this).val()).show();
    });

    $(window).delegate("select.methods", "change", function(){
        console.log($(this));
        $('.api_action').hide();
        $("select.methods option:selected").each(function(){
            $(this).parents("div.api").find('#'+$(this).val()).show();
        });
        setValueSources();
    });
    
    $(window).delegate("a.close", "click", function(){
        $(this).parents("div.api").remove();
    });
    $(window).delegate("a.hide", "click", function(){
        $(this).parents("div.api").find('.taste_box').slideUp();
    });
    $(window).delegate("button.taste", "click", function(){
        var $api = $(this).parents("div.api");
        var $codebox = $api.find("div.taste_box pre");
        
        $api.find('')
        $codebox.html("");
        var action = $api.find("select.methods").val();
        var in_param = $api.find("#"+action).find("select[name=in_param]").val();
        var query = $api.find("input[name=taste_q]").val();
        //var out = $api.find("#"+action).find("select[name=out]").val();
        var taste_config = { api: $api.attr('name'), query: query, config: { action: action, in_param: in_param } };
        console.log(taste_config);
        $.post('/taste', { data: taste_config }, function(data) {
          console.log(data);
          $codebox.html(syntaxHighlight(JSON.stringify(data, null, 4)));
          
          if(!$codebox.is(":visible")){
                $codebox.parents('.taste_box').slideDown();
            }              
        });
    });
    
    $('button#cook').click(function(){
        actionConfig = [];
        $("div.api.live").each(function(){
            var action = $(this).find("select.methods").val();
            var limit = $(this).find("select[name=limit]").val();
            var in_param = $(this).find("#"+action).find("select[name=in_param_name]").val();
            var out = $(this).find("#"+action).find("select[name=output_node]").val();        
            actionConfig.push({api: $(this).attr('name'), action: action, in_param_name: in_param, value_source: out, limit: parseInt(limit) });
        });
        console.log(actionConfig);
        $.post('/cook', { data: actionConfig }, function(data) {
          console.log(data);
          $('.results').html('Recipe updated');
          $('.results').fadeIn();
          setTimeout(function(){
                $('.results').html('');
          }, 5000);
              
        });
    });
    
    $('.ingredient').click(function(){
        var add = $(this).attr('ingredient');
        $('div.api.dummy[name="'+add+'"]').clone().removeClass('dummy').addClass('live').appendTo('body');
        setValueSources();
    });
});