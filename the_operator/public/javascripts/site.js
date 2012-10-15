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
        $selectEl = $(this).find("#"+action).find("select[name=output_node].mapped");
        $selectEl.html("");
        if(i == 0){
            $selectEl.html("<option value='entry query'>entry query</option>");
            $(this).find("#"+action).find("input[name=output_node].override").hide();
        }
        else {
            $prevRoutineElement = $(activeRoutineElements[i-1]);
            var prevName = $prevRoutineElement.attr('name').replace(".","\\.");
            $referenceElement = $("div[name=" + prevName + "].dummy");
            var prevAction = $prevRoutineElement.find("select.methods").val();
            $prevSelectEl = $referenceElement.find("#"+prevAction).find("select[name=output_node].mapped");
            
            $selectEl.html($prevSelectEl.html());     
        }
        
    });
}

function getRoutine(){
    var routine = [];
    $("div.api.live").each(function(){
        var action = $(this).find("select.methods").val();
        var limit = $(this).find("select[name=limit]").val();
        var in_param = $(this).find("#"+action).find("select[name=in_param_name]").val();
        
        var out;
        var override = $(this).find("#"+action).find("input[name=output_node].override").val();
        if(override != "")
            out = override;
        else
            out = $(this).find("#"+action).find("select[name=output_node]").val();
        
        var selected_optionals = [];
        var base_select = "#"+action+" .optionals ";
                
        $(this).find(base_select+"input, " + base_select+"select").each(function(){
            if($(this).val() != "")
                selected_optionals.push({ paramName: $(this).attr('name'), paramValue: $(this).val() });
        });
        routine.push({api: $(this).attr('name'), action: action, in_param_name: in_param, optionals: selected_optionals, value_source: out, limit: parseInt(limit) });
    });
    return routine;
}

$(document).ready(function(){
        
    $("select.methods option:selected").each(function(){
        $(this).parents("div.api").find('#'+$(this).val()).show();
    });

    $(window).delegate("select.methods", "change", function(){
        $('.api_action').hide();
        $("select.methods option:selected").each(function(){
            $(this).parents("div.api").find('#'+$(this).val()).show();
        });
        setValueSources();
    });
    
    $(window).delegate("a.remove", "click", function(){
        $(this).parents("div.api").remove();
        setValueSources();
    });
    
    $(window).delegate("a.hide_json", "click", function(){
        $(this).parents("div.api").find('.taste_box').slideUp();
    });
    
    $(window).delegate("button.taste", "click", function(){
        var $api = $(this).parents("div.api");
        var $codebox = $api.find("div.taste_box pre");
        
        $api.find('')
        $codebox.html("");
        var action = $api.find("select.methods").val();
        var in_param_name = $api.find("#"+action).find("select[name=in_param_name]").val();
        var query = $api.find("input[name=taste_q]").val();
        
        var selected_optionals = [];
        
        var base_select = "#"+action+" .optionals ";
        
        $api.find(base_select+"input, " + base_select+"select").each(function(){
            if($(this).val() != "")
                selected_optionals.push({ paramName: $(this).attr('name'), paramValue: $(this).val() });
        });
        var taste_config = { api: $api.attr('name'), query: query, config: { action: action, in_param_name: in_param_name, optionals: selected_optionals } };
        $.post('/taste', { data: taste_config }, function(data) {
          var output;
          if(data.response.length > 0)
            output = data.response[0].result
          else
            output = data.response
        
          $codebox.html(syntaxHighlight(JSON.stringify(output, null, 4)));
          $api.find("div.url a").html(data.url);
          $api.find("div.url a").attr('href',data.url);
          if(!$codebox.is(":visible")){
                $codebox.parents('.taste_box').slideDown();
            }              
        });
    });
    
    $('button.run').click(function(){
        $('#routine_results pre').html("Running...");
        $.post('/run', { data: { q: $('input[name="run_q"]').val(), routine: getRoutine() } }, function(data) {
          $('#routine_results pre').html(syntaxHighlight(JSON.stringify(data, null, 4)));              
        });
    });
    
    $('button#set').click(function(){
        var routine = getRoutine();
        console.log(routine);
        $.post('/set', { data: routine }, function(data) {
          console.log(data);
          $('.results').html('Routine updated');
          $('.results').fadeIn();
          setTimeout(function(){
                $('.results').fadeOut();
          }, 5000);
              
        });
    });
    
    $('.ingredient').click(function(){
        var add = $(this).attr('ingredient');
        $('div.api.dummy[name="'+add+'"]').clone().removeClass('dummy').addClass('live').appendTo('#routine');
        setValueSources();
    });
    
});